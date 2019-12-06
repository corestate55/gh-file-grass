# frozen_string_literal: true

require 'json'

# rubocop:disable Metrics/ClassLength
# parse a commit info by `git show`
class GitShowParser
  def initialize(git_show_str)
    @git_show_str = git_show_str
    @files = []
    @type = :modified
  end

  def to_data
    parse
    {
      commits: make_commit,
      stats: make_stats,
      files: make_files
    }
  end

  private

  # rubocop:disable Metrics/MethodLength
  def parse_header(line)
    case line
    when /^commit (.+)/
      @sha_full = Regexp.last_match(1)
    when /^Author: (.+) <(.+)>/
      @author = Regexp.last_match(1)
      @mail = Regexp.last_match(2)
    when /^Date:\s+(.+)/
      @commit_date = Regexp.last_match(1)
    when /^\s+(.+)$/
      @message = Regexp.last_match(1)
    end
  end
  # rubocop:enable Metrics/MethodLength

  def save_diff_count(count)
    return if @files.empty?

    @files[-1][:insertions] = count[:ins]
    @files[-1][:deletions] = count[:del]
  end

  def reset_diff_count(count)
    count[:ins] = 0
    count[:del] = 0
  end

  def diff_head?(line)
    line =~ %r{^diff.+a/.+ b/.+}
  end

  def diff_head_indicator?(line)
    line =~ /^\+{3}.*/ || line =~ /^\-{3}.*/
  end

  def parse_diff_head_line(line)
    line =~ %r{^diff(.+)a/(.+) b/(.+)}
    file_before = Regexp.last_match(2)
    file_after = Regexp.last_match(3)
    @files.push(
      path: file_after,
      path_src: file_before,
      path_dst: file_after,
      insertions: 0,
      deletions: 0
    )
  end

  def parse_diff_head(line, count)
    return unless diff_head?(line)

    save_diff_count(count)
    reset_diff_count(count)
    parse_diff_head_line(line)
  end

  # rubocop:disable Metrics/MethodLength
  def parse_diff_body(line, count)
    return if diff_head_indicator?(line)

    case line
    when /^new file mode (.+)/
      @files[-1][:type] = :new
      @files[-1][:mode] = Regexp.last_match(1)
    when /^index (.+)\.\.(.+)/
      @files[-1][:src] = Regexp.last_match(1)
      @files[-1][:dst] = Regexp.last_match(2)
    when /^\+.*/
      count[:ins] += 1
    when /^\-.*/
      count[:del] += 1
    end
  end
  # rubocop:enable Metrics/MethodLength

  # rubocop:disable Metrics/MethodLength
  def parse
    header = true
    count = {}
    reset_diff_count(count)

    @git_show_str.split(/\n/).each do |line|
      if header && !diff_head?(line)
        parse_header(line)
      elsif header && diff_head?(line)
        parse_diff_head(line, count)
        header = false
      else
        parse_diff_head(line, count)
        parse_diff_body(line, count)
      end
    end
    save_diff_count(count)
  end
  # rubocop:enable Metrics/MethodLength

  def make_files
    @files.map.with_index do |file, i|
      {
        name: file[:path],
        index: i + 1,
        commits: [@sha_full[0, 7]]
      }
    end
  end

  # rubocop:disable Metrics/MethodLength
  def make_stats
    @files.map do |file|
      {
        path: file[:path],
        mode: file[:mode],
        type: file[:type],
        src: file[:src],
        dst: file[:dst],
        stat_path: {
          path: file[:path],
          src: file[:path_src],
          dst: file[:path_dst]
        },
        insertions: file[:insertions],
        deletions: file[:deletions],
        lines: file[:insertions] + file[:deletions],
        sha_short: @sha_full[0, 7]
      }
    end
  end
  # rubocop:enable Metrics/MethodLength

  # rubocop:disable Metrics/MethodLength
  def make_commit
    insertions = @files.map { |f| f[:insertions] }.inject(0) { |r, x| r + x }
    deletions = @files.map { |f| f[:deletions] }.inject(0) { |r, x| r + x }
    commit = {
      sha: @sha_full,
      sha_short: @sha_full[0, 7],
      author: {
        name: @author,
        email: @mail
      },
      date: @commit_date,
      message: @message,
      index: 1,
      stat_total: {
        insertions: insertions,
        deletions: deletions,
        lines: insertions + deletions,
        files: @files.length
      }
    }
    [commit]
  end
  # rubocop:enable Metrics/MethodLength
end
# rubocop:enable Metrics/ClassLength

# gsp = GitShowParser.new('266cba1')
# puts JSON.pretty_generate(gsp.to_data)
