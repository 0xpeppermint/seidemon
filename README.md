Modified Lighthouse-cli repo designed to seamlessly snipe and trade SEI coins on Astroport 

# Features
- snipe non-live pools
- buy live pools
- monitor holdings value
- quickly sell % of holdings




# Prerequisites
- ts-node
  
# Set-up

1) Clone repo
2) Navigate to the repo and perform the initial setup:

- ```ts-node seidemon.ts load-wallet``` - enter your 12-word SEI mnemonic
- ```ts-node seidemon.ts load-rpc``` - load a sei rpc of your choice 

# Usage 
- ```ts-node lighthouse.ts snipe <gas-price>``` - enter pool address (```<gas-price>``` is optional)


# Notes
- Use solely at your own risk
- On Mac a sound notification will be played when simulation is successful
- During periods of extreme network congestion multiple buy transactions might be sent due to rpc unresponsiveness. Keep minimal funds on the sniping wallet!
- First wallet path is used from the provided mnemonic
- Good luck!

# New pool monitor
https://t.me/sei_deploys (@guappy_eth)


# Credits 
https://github.com/We-Bump/Lighthouse-cli


![image](https://github.com/0xpeppermint/seidemon/assets/162825807/e29fc709-5fe8-4853-8e7f-48fefce6a17c)
