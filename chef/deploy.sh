#!/bin/bash
# Deploys neverlate
set -e

echo "Installing latest ruby with chef using rvm"
curl -sSL https://get.rvm.io | bash
rvm install ruby
rvm --default use ruby
gem update --no-rdoc --no-ri
gem install ohai chef --no-rdoc --no-ri

echo "Configuring and running chef"
echo "
file_cache_path '${PWD}'
cookbook_path '${PWD}/cookbooks'
json_attribs ${PWD}'/node.json'
" > solo.rb
rvmsudo chef-solo -c solo.rb

echo "Neverlate is deployed."
