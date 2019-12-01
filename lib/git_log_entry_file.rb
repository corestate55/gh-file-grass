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
