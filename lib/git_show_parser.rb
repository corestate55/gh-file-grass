  def initialize(git_show_str)
    @git_show_str = git_show_str
    @git_show_str.split(/\n/).each do |line|