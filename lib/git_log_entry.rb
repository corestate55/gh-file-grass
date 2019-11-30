# frozen_string_literal: true

# property of a file in a log entry
class GitLogEntryFile
  def initialize(diff_file, diff_stat, diff_stat_path)
    @file = diff_file
    @stat = diff_stat
    @stat_path = diff_stat_path
    throw Error unless @stat
  end

  # rubocop:disable Metrics/MethodLength
  def to_data
    {
      path: @file.path,
      mode: @file.mode,
      type: invert_type,
      src: @file.dst, # invert src/dst
      dst: @file.src,
      stat_path: @stat_path,
      insertions: @stat[:deletions], # invert insertions/deletions
      deletions: @stat[:insertions],
      lines: @stat[:insertions] + @stat[:deletions]
    }
  end
  # rubocop:enable Metrics/MethodLength

  def insertions
    @stat[:deletions]
  end

  def deletions
    @stat[:insertions]
  end

  def path
    @file.path
  end

  def type
    invert_type
  end

  private

  def invert_type
    type = @file.type
    return type if type == 'modified'
    type == 'new' ? 'deleted' : 'new'
  end
end

# a log entry
class GitLogEntry
  def initialize(log)
    @log = log

    diff = @log.diff_parent
    @diff_stat_total = diff.stats[:total]
    @diff_stat_files = diff.stats[:files]
    # warn "diff_stat_files: #{@diff_stat_files}"

    @diff_files = @log.diff_parent.map do |diff_file|
      diff_stat_path = find_diff_stat(diff_file.path)
      diff_stat = @diff_stat_files[diff_stat_path]
      parsed_diff_stat_path = parse_moved_file(diff_stat_path)
      GitLogEntryFile.new(diff_file, diff_stat, parsed_diff_stat_path)
    end
    # debug_print
  end

  # rubocop:disable Metrics/MethodLength
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
        files: @diff_files.map(&:to_data)
      }
    }
  end
  # rubocop:enable Metrics/MethodLength

  private

  def debug_print
    warn "commit: #{@log.sha}"
    warn "- parents: #{@log.parents.map { |c| c.sha }}"
    @diff_files.each do |file|
      warn "- file: #{file.path} | #{file.type} (+#{file.insertions},-#{file.deletions})"
    end
  end

  def make_stats_path(path, src, dst)
    { path: path, src: src, dst: dst }
  end

  def parse_moved_file(stats_path)
    if stats_path =~ /({(.+)? => (.+)?})/
      changed = Regexp.last_match(1)
      be_src = Regexp.last_match(2)
      be_dst = Regexp.last_match(3)
      src = stats_path.sub(changed, be_src || '')
      dst = stats_path.sub(changed, be_dst || '')
      inverted_stats_path = stats_path.sub(changed, "{#{dst} => #{src}}")
      # warn "#{stats_path}"
      # warn "  - changed: #{changed}, #{be_src}, #{be_dst}"
      # warn "  - src: #{src}"
      # warn "  - dst: #{dst}"
      # warn "  - inverted_stats_path: #{inverted_stats_path}"
      make_stats_path(inverted_stats_path, dst, src) # invert src/dst
      # make_stats_path(stats_path, src, dst)
    elsif stats_path =~ /((.+) => (.+))/
      changed = Regexp.last_match(1)
      src = Regexp.last_match(2)
      dst = Regexp.last_match(3)
      inverted_stats_path = stats_path.sub(changed, "{#{dst} => #{src}}")
      make_stats_path(inverted_stats_path, dst, src) # invert src/dst
      # make_stats_path(stats_path, src, dst)
    else
      make_stats_path(stats_path, stats_path, stats_path) # dummy
    end
  end

  def find_diff_stat(path)
    @diff_stat_files.each_key.find do |k|
      file_path = parse_moved_file(k)
      # file_path[:src] == path
      file_path[:dst] == path # invert src/dst
    end
  end
end
