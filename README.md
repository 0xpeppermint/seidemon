 ## Seidemon is a CLI tool to snipe and trade SEI coins on Astroport 

![image](https://github.com/0xpeppermint/seidemon/assets/162825807/e29fc709-5fe8-4853-8e7f-48fefce6a17c)

# Features
- snipe non-live pools
- buy live pools
- monitor holdings value
- quickly sell % of holdings




# Prerequisites
- [node.js](https://nodejs.org/en)
- typescript ```npm install -g typescript```
- ts-node ```npm install -g ts-node```

  
# Set-up

1) Clone this repository
2) Navigate to the repository and perform the initial setup:

- Install dependencies ```npm install```
- Enter 12-word mnemonic ```ts-node seidemon.ts load-wallet```
- Optionally, provide a SEI RPC ```ts-node seidemon.ts load-rpc``` 

# Usage 
- ```ts-node lighthouse.ts snipe``` 


# Notes
- Use at your own risk. Keep minimum funds on the sniping wallet.
- A sound notification is played when a simulation is successful (e.g. pair is live)
- The first wallet path is used from the provided mnemonic
- Default (public) RPC is not stable during network congestion
- DM for [support](https://twitter.com/0xpeppermint)
- [New pool monitor](https://t.me/sei_deploys) by [@guappy_eth](https://twitter.com/guappy_eth)



## Credits 
https://github.com/We-Bump/Lighthouse-cli
