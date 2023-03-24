# Edge Impulse Standalone Vision Inferencing Kiosk
Use this Balena OS repo to easily set up a live view of on-device inferencing for conferences etc. Based upon https://github.com/balena-labs-projects/browser and the edge-impulse-cli.

How to:
- Flash Balena OS to your desired SBC/NUC/Pi https://www.balena.io/devices
- Clone this repo locally
- use balena-cli to build and push this folder with ```balena push <Fleet Name> --source ./```
- Plug your edge device (with your EI firmware loaded onto it) into a USB port on your SBC
- Plug in your display
- Live inferencing should be displayed on the screen

Useful Environment Variables (others can be found at the balena project referenced above):
```
# Add [chromium flags](https://peter.sh/experiments/chromium-command-line-switches/) here to alter the web browser. Below is an example of how you can scale up the web page rendering to 1.5x (you reduce the window size and scale to the output res) 
FLAGS = --window-size=1280,720 --force-device-scale-factor=1.5
# This is set by default to the localhost and the port the cli tool outputs to. If you wanted to run multiple devices then you could add a second container for a second instance of the CLI runnner and point that container's port 4915 to another host port. You would aslo need a second display and to change the variable DISPLAY_NUM to match 
LAUNCH_URL = http://localhost:4915
# This is set by default to make sure the CLI runner has time to detect the device and launch the web host before the kiosk is launched
LOCAL_HTTP_DELAY = 10
```