# -*- coding: utf-8 -*-
#
# Cookbook Name:: neverlate
# Recipe:: default
#
package 'git-core'
package 'vim'
package 'ack-grep'
package 'htop'


include_recipe 'python'

python_virtualenv "/home/vagrant/neverlate_ve" do
  owner "vagrant"
  group "vagrant"
  action :create
end

# target a virtualenv
python_pip "django" do
  virtualenv "/home/vagrant/neverlate_ve"
end
