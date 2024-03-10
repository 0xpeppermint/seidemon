 ## Seidemon is a CLI tool designed to seamlessly snipe and trade SEI coins on Astroport 

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

1) Clone repo
2) Navigate to the repo and perform the initial setup:

- ```ts-node seidemon.ts load-wallet``` - enter your 12-word SEI mnemonic
- ```ts-node seidemon.ts load-rpc``` - enter SEI rpc url

# Usage 
- ```ts-node lighthouse.ts snipe``` - enter pool address 


# Notes
- Use solely at your own risk. Keep minimal funds on the sniping wallet.
- On Mac a sound notification will be played when a simulation is successful
- First wallet path is used from the provided mnemonic
- DM for [support](https://twitter.com/0xpeppermint)
- [New pool monitor](https://t.me/sei_deploys) by [@guappy_eth](https://twitter.com/guappy_eth)



## Credits 
https://github.com/We-Bump/Lighthouse-cli
