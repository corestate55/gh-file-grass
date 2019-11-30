# frozen_string_literal: true
require 'json'
require 'optparse'
require_relative '../lib/git_log'

# "Usage: [bundle exec] ruby #{$0} [-r /path/to/repo-dir] [-n count]"
params = ARGV.getopts('r:n:p')
repo_path = params['r'] || '.' # optional, default:. = current dir
count = params['n'] || nil # optional, default:nil = use all logs
pretty_print = params['p'] || nil # optional, default:nil = disable pretty print

git_log = GitLog.new(repo_path, count)
if pretty_print
  puts JSON.pretty_generate(git_log.to_data)
else
  puts JSON.generate(git_log.to_data)
end
