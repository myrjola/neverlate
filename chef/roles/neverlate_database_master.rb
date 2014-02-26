name 'neverlate_database_master'
description 'Setups postgres'
run_list(
         'recipe[postgresql::server]',
         'recipe[neverlate::database]',
         )

default_attributes :postgresql => {
  "password" => {
    "postgres" => "neverlate"
  }
}
