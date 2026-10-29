# Memblu Music - Millions of songs, instantly. Online, offline.
> [!NOTE]
> Memblu Music should either be hosted from a residential IP OR should have outbound traffic routed through a residential proxy, VPN, or exit node. [Why?](https://github.com/Memblu/MembluMusic/edit/main/README.md#why-does-it-need-to-be-on-a-residential-ip-address)

Millions of songs, instantly. Online, offline.

## Requirements
- Node.js v22+
- An internet connection
- A residential proxy or exit node.
- At least 512 MB of RAM
- At least 4 GB of storage

### Why does it need to be on a residential IP address?
Memblu Music pulls music by streaming it from YouTube Music's content CDN, and for this to work reliably, you need to either be using a residential IP address or routing Memblu Music's outbound traffic through a residential proxy or exit node.

Alternatively, you can create a file called cookies.txt (must use the Netscape cookies format). There are several extensions for most major browsers that can help you export such a file.

## Getting Started
Ensure you have met the requirements above before continuing.

The following commands will start Memblu Music on port ``3000``. 
You can change the port Memblu Music uses by defining the ``PORT`` variable in your
terminal/environment before running ``npm run start``.
```bash
npm i
npm run start
```
