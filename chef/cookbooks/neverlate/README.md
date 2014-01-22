neverlate Cookbook
==================
Configures things for neverlate

Requirements
------------
#### cookbooks
python - neverlate uses virtualenv

Attributes
----------
None yet

Usage
-----
#### neverlate::default

Just include `neverlate` in your node's `run_list`:

```json
{
  "name":"my_node",
  "run_list": [
    "recipe[neverlate]"
  ]
}
```

License and Authors
-------------------
Authors: Martin Yrjölä
