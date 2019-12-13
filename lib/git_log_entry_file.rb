# frozen_string_literal: true

# property of a file in a log entry
class GitLogEntryFile
  attr_reader :path, :mode, :type, :src, :dst, :stat_path,
              :insertions, :deletions, :lines

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
      type: @file.type,
      src: @file.src,
      dst: @file.dst,
      bin: @file.binary?,
      stat_path: @stat_path,
      insertions: @stat[:insertions],
      deletions: @stat[:deletions],
      lines: @stat[:insertions] + @stat[:deletions]
    }
  end
  # rubocop:enable Metrics/MethodLength
end
