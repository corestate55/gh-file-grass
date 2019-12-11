# frozen_string_literal: true

require 'git'
require_relative './git_show_parser'
require_relative './git_log_entry'

# container of logs: repository level
class GitLog
  def initialize(repository, count = 5)
    @git = Git.open(repository)
    @count = count || nil
    @commits = make_commits
    @stats = make_stats
    @file_table = make_file_table
  end

  def to_data
    data = to_data_without_init_commit
    # append initial commit data if necessary
    init_log = @git.log(@count).find { |log| log.parent.nil? }
    init_log ? merge_data(data, init_log) : data
  end

  private

  def to_data_without_init_commit
    {
      repo: @git.repo,
      branch: @git.branches.local.find(&:current),
      origin: @git.config['remote.origin.url'].gsub(/\.git$/, ''),
      commits: reconstruct_commits,
      stats: @stats,
      files: @file_table
    }
  end

  def merge_commits_data(data, merger)
    data[:commits].concat(merger[:commits])
    data[:commits].each_with_index do |c, i|
      c[:index] = data[:commits].length - i
    end
  end

  def merge_stats_data(data, merger)
    data[:stats].concat(merger[:stats])
    data[:stats].each_with_index { |s, i| s[:index] = i + 1 }
  end

  # rubocop:disable Metrics/AbcSize, Metrics/MethodLength
  def merge_files_data(data, merger)
    merger[:files].each do |tf|
      f2merge = data[:files].find { |f| f[:name] == tf[:name] }
      if f2merge
        f2merge[:commits].concat(tf[:commits])
      else
        data[:files].push(tf)
      end
    end
    data[:files]
      .sort! { |a, b| a[:name] <=> b[:name] }
      .each_with_index { |f, i| f[:index] = i + 1 }
  end
  # rubocop:enable Metrics/AbcSize, Metrics/MethodLength

  def merge_data(data, init_log)
    log_parser = GitShowParser.new(@git.show(init_log.sha))
    merger = log_parser.to_data
    merge_commits_data(data, merger)
    merge_files_data(data, merger)
    merge_stats_data(data, merger)
    data
  end

  def make_commits
    # logs(count = nil) gets all logs
    # NOTICE: first commit:
    #   ignore first commit (it doesn't have parent), because
    #   `diff_parent` for the log returns "diff initial-commit current".
    commits = @git.log(@count)
                  .reject { |log| log.parent.nil? }
                  .map { |log| GitLogEntry.new(log, @git).to_data }
    commits.each_with_index { |commit, i| commit[:index] = commits.length - i }
    commits
  end

  def make_stats
    stats = @commits.map do |commit|
      commit[:stat][:files].map do |stat_file|
        stat_file[:sha_short] = commit[:sha_short]
        stat_file
      end
    end
    stats.flatten.each_with_index { |stat, i| stat[:index] = i + 1 }
  end

  def make_file_table_from_stats
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

  def make_file_table
    file_table = make_file_table_from_stats
    file_table.keys.sort.map.with_index do |file, index|
      {
        name: file,
        index: index + 1,
        commits: file_table[file]
      }
    end
  end

  def reconstruct_commits
    # move [stat][total] to [stat_total]
    # and delete [stat][files] it was followed as @stats array.
    @commits.each do |commit|
      commit[:stat_total] = commit[:stat][:total] # rename
      commit[:stat_total][:insertions] = commit[:stat][:total][:insertions]
      commit[:stat_total][:deletions] = commit[:stat][:total][:deletions]
      # delete unused key
      commit.delete(:stat)
    end
  end
end
