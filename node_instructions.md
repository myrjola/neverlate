# instructions to make node.js and coffescript work in python virtualenv:
* source your self to virtualenv
    _env/bin/activate_
* download node.js and extract it to a folder under, eg. env/node
* get the whole directory of the env/node directory with _pwd_
* descend in to the env/node directory
* configure node to use this directory for node ./configure --prefix=<directory path you got with pwd>
* run _make_
* run _make install_
* test that node is installed properly _which node_, this should give you the directory in your virtualenv
* install coffescript _npm install -g coffee-script_
* test that coffeescript installed properly with _which coffee_ this should once again point to your virtualenv
* be happy and prosper :)