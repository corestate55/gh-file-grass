# frozen_string_literal: true

require 'git'
require 'json'
require 'optparse'

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
      stat_path: @stat_path,
      insertions: @stat[:insertions],
      deletions: @stat[:deletions],
      lines: @stat[:insertions] + @stat[:deletions]
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
  def initialize(repository, count = 5)
    @git = Git.open(repository)
    @count = count || nil
    @commits = make_commits
    @stats = make_stats
    @file_table = make_file_table
  end

  def to_data
    {
      repo: @git.repo,
      branch: @git.branch.full,
      commits: reconstruct_commits,
      stats: @stats,
    files: @file_table
    }
  end

  private

  def make_commits
    # logs(count = nil) gets all logs
    commits = @git.log(@count).map { |log| GitLogEntry.new(log).to_data }
    commits.each_with_index { |commit, i | commit[:index] = commits.length - i }
    commits
  end

  def make_stats
    stats = @commits.map do |commit|
      commit[:stat][:files].map do |stat_file|
        stat_file[:sha_short] = commit[:sha_short]
        stat_file
      end
    end
    stats.flatten
  end

  def make_file_table
    file_table = {}
    @stats.each do |stat|
      if file_table[stat[:path]]
        file_table[stat[:path]].push(stat[:sha_short])
      else
        file_table[stat[:path]] = [stat[:sha_short]]
      end
    end
    file_table
  end

  def reconstruct_commits
    # move [stat][total] to [stat_total]
    # and delete [stat][files] it was followed as @stats array.
    @commits.each do |commit|
      commit[:stat_total] = commit[:stat][:total] # rename
      commit.delete(:stat)
    end
  end
end

# "Usage: [bundle exec] ruby #{$0} [-r /path/to/repo-dir] [-n count]"
params = ARGV.getopts('r:n:p')
repo_path = params['r'] || '.' # optional, default: current dir
count = params['n'] || nil # optional, default: nil = use all logs
pretty_print = params['p'] || nil # optional, default: nil = disable pretty print

git_log = GitLog.new(repo_path, count)
if pretty_print
  puts JSON.pretty_generate(git_log.to_data)
else
  puts JSON.generate(git_log.to_data)
end
