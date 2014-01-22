name 'neverlatedev'
description 'Setups a NeverLate development environment'
run_list(
         'recipe[apt]',
         'recipe[python]',
         'recipe[neverlate]'
         )
