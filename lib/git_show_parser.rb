require 'json'

class GitShowParser
  def initialize(sha)
    @sha = sha
    @files = []
    @type = :modified
  end

  def parse
    header = true
    insertion_count = 0
    deletion_count = 0

    git_show_str = `git show #{@sha}`
    git_show_str.split(/\n/).each do |line|
      # puts line
      if line =~ /^commit (.+)/
        @sha_full = Regexp.last_match(1)
        next
      end
      if line =~ /^Author: (.+) <(.+)>/
        @author = Regexp.last_match(1)
        @mail = Regexp.last_match(2)
        next
      end
      if line =~ /^Date:\s+(.+)/
        @commit_date = Regexp.last_match(1)
        next
      end
      next if line =~ /^\s*$/

      if header && line =~ /^\s+(.+)$/
        @message = Regexp.last_match(1)
      end

      if line =~ /^diff(.+)a\/(.+) b\/(.+)/
        header = false
        unless @files.empty?
          @files[-1][:insertion] = insertion_count
          @files[-1][:deletion] = deletion_count
        end
        insertion_count = 0
        deletion_count = 0

        file_before = Regexp.last_match(2)
        file_after = Regexp.last_match(3)
        @files.push({
                      path: file_after,
                      path_src: file_before,
                      path_dst: file_after,
                      insertion: 0,
                      deletion: 0
                    })
        next
      end
      if line =~ /^new file mode (.+)/
        @files[-1][:type] = :new
        @files[-1][:mode] = Regexp.last_match(1)
        next
      end
      if line =~ /^index (.+)\.\.(.+)/
        @src = Regexp.last_match(1)
        @dst = Regexp.last_match(2)
        @files[-1][:src] = @src
        @files[-1][:dst] = @dst
        next
      end
      next if line =~ /^\+\+\+.*/ || line =~ /^---.*/
      if line =~ /^\+.*/
        insertion_count += 1
        next
      end
      if line =~ /^\-.*/
        deletion_count += 1
        next
      end
    end
    unless @files.empty?
      @files[-1][:insertion] = insertion_count
      @files[-1][:deletion] = deletion_count
    end
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

  def make_files
    @files.map.with_index do |file, i|
      {
        name: file[:path],
        index: i + 1,
        commits: [ @sha_full[0, 7] ]
      }
    end
  end

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
        insertions: file[:insertion],
        deletions: file[:deletion],
        lines: file[:insertion] + file[:deletion],
        sha_short: @sha_full[0, 7]
      }
    end
  end

  def make_commit
    insertions = @files.map { |f| f[:insertion] }.inject(0) { |r, x| r + x }
    deletions = @files.map { |f| f[:deletion] }.inject(0) { |r, x| r + x }
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
        file: @files.length
      }
    }
    [ commit ]
  end
end

# gsp = GitShowParser.new('266cba1')
# puts JSON.pretty_generate(gsp.to_data)
