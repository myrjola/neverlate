name 'neverlate_production'
description 'Deploys neverlate to production'
run_list(
         'recipe[apt]',
         'role[neverlate_database_master]',
         'recipe[neverlate::deploy]',
         'recipe[nginx]',
         'recipe[neverlate::nginx]',
         )
