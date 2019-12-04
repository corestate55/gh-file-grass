# frozen_string_literal: true

require_relative './git_log_entry_file'

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
    warn "- parents: #{@log.parents.map(&:sha)}"
    @diff_files.each do |file|
      warn "- file: #{file.path} | #{file.type}" \
           " (+#{file.insertions},-#{file.deletions})"
    end
  end

  def make_stats_path(path, _changed, src, dst)
    { path: path, src: src, dst: dst }
  end

  def make_inverted_stats_path(path, changed, src, dst)
    # invert src/dst
    inverted_changed = "{#{dst} => #{src}}"
    inverted_path = path.sub(changed, inverted_changed)
    [inverted_path, inverted_changed, dst, src]
  end

  def params_from(stats_path, changed, be_src, be_dst)
    src = stats_path.sub(changed, be_src || '')
    dst = stats_path.sub(changed, be_dst || '')
    [stats_path, changed, src, dst]
  end

  # rubocop:disable Metrics/MethodLength
  def parse_moved_file(stats_path)
    case stats_path
    when /({(.+)? => (.+)?})/
      md = Regexp.last_match
      inv_paths = make_inverted_stats_path(stats_path, md[1], md[2], md[3])
      make_stats_path(*params_from(*inv_paths))
    when /((.+) => (.+))/
      md = Regexp.last_match
      inv_paths = make_inverted_stats_path(stats_path, md[1], md[2], md[3])
      make_stats_path(*inv_paths)
    else
      make_stats_path(stats_path, '', stats_path, stats_path) # dummy
    end
  end
  # rubocop:enable Metrics/MethodLength

  def find_diff_stat(path)
    @diff_stat_files.each_key.find do |k|
      file_path = parse_moved_file(k)
      # file_path[:src] == path
      file_path[:dst] == path # invert src/dst
    end
  end
end
