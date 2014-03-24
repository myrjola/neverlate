neverlate
=========

Travel planner using reittiopas-api

To get started:
git submodule init && git submodule update
vagrant up
vagrant ssh
cd /vagrant/neverlate # To get to the django-project in the host's neverlate repository
source ~/neverlate_ve/bin/activate # activate virtualenv
python manage.py runserver 0.0.0.0:8000

Now you should now be able to navigate to localhost:8000 in the host's browser.
You can develop the service on the guest or host, the changes are synced.

If something went wrong in your environment you can always:
vagrant destroy
vagrant up

This will make you a clean virtual environment.
