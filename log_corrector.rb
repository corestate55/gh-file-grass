# frozen_string_literal: true

require 'git'
require 'json'

class GitLogEntryFile
  def initialize(diff_file, diff_stat, diff_stat_path)
    @file = diff_file
    @stat = diff_stat
    @stat_path = diff_stat_path
    throw Error unless @stat
  end

  def to_data
    {
      path: @file.path,
      mode: @file.mode,
      type: @file.type,
      src: @file.src,
      dst: @file.dst,
      stat: {
        path: @stat_path,
        insertions: @stat[:insertions],
        deletions: @stat[:deletions],
        lines: @stat[:insertions] + @stat[:deletions]
      }
    }
  end
end

class GitLogEntry
  def initialize(log)
    @log = log
    diff_stats = log.diff_parent.stats
    @diff_stat_total = diff_stats[:total]
    @diff_stat_files = diff_stats[:files]
    @diff_files = log.diff_parent.map do |diff_file|
      diff_stat_path = find_diff_stat(diff_file.path)
      GitLogEntryFile.new(diff_file, @diff_stat_files[diff_stat_path], parse_moved_file(diff_stat_path))
    end
  end

  def to_data
    {
      sha: @log.sha,
      sha_short: @log.sha[0, 7],
      author: {
        name: @log.author.name,
        email: @log.author.email
      },
      date: @log.date,
      message: @log.message,
      stat: {
        total: @diff_stat_total,
        files: @diff_files.map { |d| d.to_data }
      }
    }
  end

  private

  def parse_moved_file(stats_path)
    if stats_path =~ /({(.+)? => (.+)?})/
      changed, src, dst = $1, $2, $3
      {
        path: stats_path,
        src: stats_path.sub(changed, src || ''),
        dst: stats_path.sub(changed, dst || '')
      }
    elsif stats_path =~ /(.+) => (.+)/
      src, dst = $1, $2
      { path: stats_path, src: src, dst: dst }
    else
      { path: stats_path, src: stats_path, dst: stats_path } # dummy
    end
  end

  def find_diff_stat(path)
    @diff_stat_files.each_key.find do |k|
      file_path = parse_moved_file(k)
      file_path[:src] == path
    end
  end
end

class GitLog
  def initialize(name, repository)
    @name = name
    @git = Git.open(repository)
    set_repo_info
    set_repo_logs
  end

  def to_data
    {
      name: @name,
      branch: @branch,
      logs: @logs.map { |l| l.to_data }
    }
  end

  private

  def set_repo_logs
    # logs(count = nil) gets all logs
    @logs = @git.log(nil).map { |log| GitLogEntry.new(log) }
  end

  def set_repo_info
    @branch = @git.branch.full
  end
end

git_log = GitLog.new('netoviz', '~/nwmodel/netoviz')
puts JSON.pretty_generate(git_log.to_data)
