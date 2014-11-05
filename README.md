

# Echo Backend

## TODO

mysql date problem
optimize bcrypt 
test ssl cert
global error handling (esp. body parser)
update swagger models
centralize autorization

## Useful
sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000

sudo npm install forever --global
sudo cp echo-service /etc/init.d/
sudo chmod a+x /etc/init.d/echo-service
sudo update-rc.d echo-service defaults

http://book.mixu.net/node/ch10.html
http://stackoverflow.com/questions/10197405/iptables-remove-specific-rules