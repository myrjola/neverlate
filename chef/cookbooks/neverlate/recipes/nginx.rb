service "nginx" do
  enabled true
  running true
  supports :status => true, :restart => true, :reload => true
  action [:start, :enable]
end

cookbook_file "/etc/nginx/conf.d/neverlate.conf" do
  source "neverlate_nginx.conf"
  mode 0640
  owner "root"
  group "root"
  notifies :restart, resources(:service => "nginx")
end
