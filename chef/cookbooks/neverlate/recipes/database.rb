postgresql_connection_info = {
  :host     => '127.0.0.1',
  :port     => node['postgresql']['config']['port'],
  :username => 'postgres',
  :password => node['postgresql']['password']['postgres']
}

# Create a postgresql user but grant no privileges
postgresql_database_user 'neverlate' do
  connection postgresql_connection_info
  password   'neverlate'
  action     :create
end

postgresql_database 'neverlate' do
  connection postgresql_connection_info
  action     :create
end

postgresql_database_user 'neverlate' do
  connection    postgresql_connection_info
  database_name 'neverlate'
  privileges    [:all]
  action        :grant
end
