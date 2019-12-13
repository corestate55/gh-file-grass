# frozen_string_literal: true

require_relative './git_log_entry_file'

# a log entry
class GitLogEntry
  def initialize(log, git)
    @log = log

    diff = git.diff(@log.parent.sha, @log.sha)
    # diff.stats =>
    #   {total: {insertions: XX, deletions: XX, lines: XX, files: XX},
    #    files: [{'path/to/file1' => {insertions: XX, deletions: XX},
    #            {'path/to/file2' => {insertions: XX, deletions: XX},...]}
    @stats_total = diff.stats[:total]
    @stat_of_file = diff.stats[:files]
    @diff_files = log_entry_files_from(diff)
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
        total: @stats_total,
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

  def log_entry_files_from(diff)
    # convert moved(renamed) file path in `@stat_of_file`.
    stat_of = convert_stat_of_file
    diff.map do |diff_file|
      # diff_file is a Git::Diff::DiffFile class instance
      # It has...
      #   - path: file path
      #   - patch: diff body
      #   - mode: file permission
      #   - src: diff hash
      #   - dst: diff hash
      #   - type: new/modified/deleted
      #   - #binary?
      stat = stat_of[diff_file.path][:stat]
      parsed_stat_path = stat_of[diff_file.path][:stat_path]
      GitLogEntryFile.new(diff_file, stat, parsed_stat_path)
    end
  end

  def make_stat_path(path, _changed, src, dst)
    { path: path, src: src, dst: dst }
  end

  def params_from(path, changed, be_src, be_dst)
    src = path.sub(changed, be_src || '')
    dst = path.sub(changed, be_dst || '')
    [path, changed, src, dst]
  end

  def parse_moved_path(path)
    case path
    when /({(.+)? => (.+)?})/
      md = Regexp.last_match
      make_stat_path(*params_from(path, md[1], md[2], md[3]))
    when /((.+) => (.+))/
      md = Regexp.last_match
      make_stat_path(path, md[1], md[2], md[3])
    else
      make_stat_path(path, '', path, path) # dummy
    end
  end

  def convert_stat_of_file
    parsed = @stat_of_file.map do |path, stat|
      # A key of `@stat_of_file` includes '{src=>dst}' when the file was moved.
      # Convert `{src=>dst}` style path to {path:, src:, dst:}
      parsed_path = parse_moved_path(path)
      # For moved file {src=>dst},
      # `diff_file.path` (in diff.map) correspond with src path.
      [parsed_path[:src], { stat: stat, stat_path: parsed_path }]
    end
    parsed.to_h
  end
end
