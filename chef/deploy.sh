#!/bin/bash
# Deploys neverlate
set -e

echo "Configuring and running chef"
echo "
file_cache_path '${PWD}'
cookbook_path '${PWD}/cookbooks'
json_attribs '${PWD}/node.json'
" > solo.rb
sudo chef-solo -c solo.rb
echo "Neverlate is deployed."
