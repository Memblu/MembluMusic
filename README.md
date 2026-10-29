# Memblu Music - Millions of songs, instantly. Online, offline.
> [!NOTE]
> Memblu Music should either be hosted from a residential IP OR should have outbound traffic routed through a residential proxy, VPN, or exit node. [Why?](https://github.com/Memblu/MembluMusic/edit/main/README.md#why-does-it-need-to-be-on-a-residential-ip-address)

Millions of songs, instantly. Online, offline.

## Hosting requirements
- Node.js v22+
- An internet connection
- A residential proxy or exit node.

### Why does it need to be on a residential IP address?
Memblu Music pulls music by streaming it from YouTube Music's content CDN, and for this to work reliably, you need to either be using a residential IP address or routing Memblu Music's outbound traffic through a residential proxy or exit node.

Alternatively, you can create a file called cookies.txt (must use the Netscape cookies format). There are several extensions for most major browsers that can help you export such a file.
