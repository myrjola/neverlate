include_recipe 'application'

directory "/srv/neverlate/static" do
  owner      'nobody'
  group      'nogroup'
  action     :create
  recursive  true
end

directory "/srv/neverlate/shared" do
  owner      'nobody'
  group      'nogroup'
  action     :create
  recursive  true
end

application 'neverlate' do
  path       '/srv/neverlate'
  owner      'nobody'
  group      'nogroup'
  repository 'https://github.com/myrjola/neverlate.git'
  revision   'master'
  migrate    true
  packages   ['git-core']

  # copy django-root to git root to fix deploy
  before_migrate do
    execute "mv django/* ." do
      user new_resource.owner
      group new_resource.group
      cwd new_resource.release_path
    end
  end

  django do
    requirements      'requirements.txt'
    debug             true
    collectstatic     true
    database do
      database 'neverlate'
      adapter  'postgresql_psycopg2'
      username 'neverlate'
      password 'neverlate'
    end
    database_master_role 'neverlate_database_master'
  end

  gunicorn do
    app_module :django
  end

  celery do
    config "local_celery.py"
    django true
    celerybeat true
    celerycam true
    broker do
      transport "django"
      host_role "neverlate_production"
    end
  end
end
