import { program } from "commander"
import ora from "ora"
import inquirer from "inquirer"
import chalk from "chalk"
import fs from "fs"
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing"
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate"
import { GasPrice } from "@cosmjs/stargate";
import { MerkleTree } from 'merkletreejs';
import BigNumber from 'bignumber.js';
import { keccak_256 } from '@noble/hashes/sha3'
import path from "path"
import { exec, ExecException } from 'child_process';
import { fromBase64, toHex, toUtf8 } from "@cosmjs/encoding";
import {
  MsgClearAdmin,
  MsgExecuteContract,
  MsgInstantiateContract,
  MsgMigrateContract,
  MsgStoreCode,
  MsgUpdateAdmin,
} from "cosmjs-types/cosmwasm/wasm/v1/tx";


const loadConfig = () => {
    //check if config exists
    if (fs.existsSync("./config.json")) {
        let config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))

        if (!config.mnemonic || !config.rpc || !config.network) {
            console.log(chalk.red("\nConfig file is missing required fields (mnemonic, rpc, network)"))
            process.exit(1)
        }

        return config

    } else {
        console.log(chalk.red("\nConfig file not found"))
        process.exit(1)
    }
}


function playSound() {
    let command;

    switch (process.platform) {
        case 'darwin': // macOS
            command = 'afplay noti.mp3'; // Replace with your sound file path
            break;
        case 'win32': // Windows
            // Use echo to emit a beep
            command = 'echo ^G';
            break;
        default:
            console.error('Unsupported platform');
            return;
    }

    exec(command, (error: ExecException | null, stdout: string, stderr: string) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return;
        }
    });
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

async function simulate(
    pool: string, 
    amount: string, 
    client: SigningCosmWasmClient, 
    wallet: string, 
    tokenName: string,
    onSuccess: (estimation: any) => Promise<void>
): Promise<void> {

    const swapMsg = {
        swap: {
            offer_asset: {
                info: {
                    native_token: {
                        denom: "usei"
                    }
                },
                amount: amount
            },
            max_spread: "0.49"
        }
    };

    const coins = [{
        denom: 'usei',
        amount: amount,
    }];


    const instruction = {
      contractAddress: pool,
      msg: swapMsg,
      funds: coins,
    };

    const instructions = [instruction]

    const msgs = instructions.map((i) => ({
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: wallet,
        contract: i.contractAddress,
        msg: toUtf8(JSON.stringify(i.msg)),
        funds: [...(i.funds || [])],
      }),
    }));

    let spinner = ora(`Simulating ${Math.round(parseFloat(amount)/1000000)} SEI buy of ${tokenName} at pool: ${pool}`).start();

    return new Promise<void>(async (resolve, reject) => {
        let isSuccessful = false;
        while (!isSuccessful) {
            client.simulate(wallet, msgs, "").then(async estimation => {
                if (!isSuccessful) {
                    isSuccessful = true;
                    spinner.succeed(`Simulation success: `+ chalk.green(estimation) + chalk.green(" gas used"));
                    playSound();
                    await onSuccess(estimation);
                    resolve(); // Resolve the promise after onSuccess completes
                }
            }).catch(error => {
                if (!isSuccessful) {
                    if (error instanceof Error) {
                        if (error.message.includes("empty")) {
                            //console.error(`\n Simulation reverted! not live yet...`);
                        } else {
                            console.error("\nError executing transaction:", error.message);
                        }
                    } else {
                        console.error("\nAn unexpected error occurred:", error);
                    }
                }
            });

            if (!isSuccessful) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
    });

}


async function signAndBroadcast(pool:string, amount: string, client: SigningCosmWasmClient, wallet: string, tokenName: string) {

    const swapMsg = {
        swap: {
            offer_asset: {
                info: {
                    native_token: {
                        denom: "usei"
                    }
                },
                amount: amount
            },
            max_spread: "0.49"
        }
    };

    const coins = [{
        denom: 'usei',
        amount: amount,
    }];


    const instruction = {
      contractAddress: pool,
      msg: swapMsg,
      funds: coins,
    };

    const instructions = [instruction]

    const msgs = instructions.map((i) => ({
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: wallet,
        contract: i.contractAddress,
        msg: toUtf8(JSON.stringify(i.msg)),
        funds: [...(i.funds || [])],
      }),
    }));

    let spinner = ora(`Sniping ${Math.round(parseFloat(amount)/1000000)} SEI of ${tokenName} at pool: ${pool}`).start();

    const mintReceipt = await client.signAndBroadcast(wallet, msgs, "auto", "sniping bot by 0xpeppermint")

    spinner.succeed(`Sniped ${Math.round(parseFloat(amount)/1000000)} SEI of ${tokenName} at pool: ${pool}`)
    
    console.log("tx_hash: " + chalk.green(mintReceipt.transactionHash));
    return 0

}


async function getValue(pool: string, client: SigningCosmWasmClient, walletAddress: string, initialBalance: number, tokenName: string, tokenContract: string) {

    let pairResponse = await client.queryContractSmart(pool, { pair: {}})

    let infoResponse = await client.queryContractSmart(tokenContract, { token_info: {}})

    let balanceResponse = await client.queryContractSmart(tokenContract, { balance: {address:walletAddress}})
    const tokenBalance = balanceResponse.balance;

    const valueQueryMsg = {
        simulation: {
            offer_asset: {
                info: {
                    token: {
                        contract_addr: tokenContract
                    }
                },
                amount: tokenBalance
            },
            ask_asset_info: {
                native_token: {
                    denom: "usei"
                }
            }
        }
    }; 

    const troll = ["wanna jeet it?","send it turbo.","tech better than bananabot","dev is goat","1 SEI = 1 SEI","best chain fr","| current SEI price: $4.69","milady","next bitcoin.","generational wealth", "remilio.","next pepe","1M programmed","who just jeeted?","rugging in 3,2,1...","post it on twitter","send peppermint 10% (pls)","run it up","wtf?!","going to zero...","its so over...","we are so back.","WAGMI!","going to 1M (soon)","MASSIVE!", "better sell some here","gg","rip","strong resistance at 0", "MEGASENDOOOOOOR","FREE!","currency of the future"]

    const randomIndex = Math.floor(Math.random() * troll.length);
    const randomString = troll[randomIndex];

    const seiBalanceResponse = await client.getBalance(walletAddress, "usei");
    const currentBalance = Number(seiBalanceResponse.amount)/1000000;
    const pnl = currentBalance - initialBalance
    

    if (tokenBalance>0) {
        let heldTokenValue = await client.queryContractSmart(pool, valueQueryMsg)    
        const tokenValue = parseFloat(heldTokenValue.return_amount) / 1000000;

        console.log(chalk.grey("---------------------------------"))
        console.log()
        console.log(chalk.green(`You hold ${Math.round(parseFloat(tokenBalance)/1000000)} of ${tokenName}`));
        console.log(chalk.green(`Your BAG is worth ${Math.round(tokenValue)} SEI. ` + chalk.grey(randomString)));
        console.log(chalk.green(`Balance: ` + Math.round(currentBalance) + " / " + `PnL: ` + Math.round(pnl) + " SEI."))
        return { tokenValue, tokenBalance };
    
    } else {
        const tokenValue = 0 
        console.log(chalk.grey("---------------------------------"))
        console.log()
        console.log(chalk.green(`You hold ${Math.round(parseFloat(tokenBalance)/1000000)} of ${tokenName}`));
        console.log(chalk.green(`Your BAG is worth ${Math.round(tokenValue)} SEI. ` + chalk.grey(randomString)));
        console.log(chalk.green(`Balance: ` + Math.round(currentBalance) + " / " + `PnL: ` + Math.round(pnl) + " SEI."))
        return { tokenValue, tokenBalance };
    }

    
}


async function sell(pool:string, amount: number, client: SigningCosmWasmClient, wallet: string, tokenValue: GLfloat, percentToSell: GLfloat, tokenContract: string) {

    let spinner = ora(`jeeting ${amount/1000000} tokens for ${Math.round(percentToSell/100 * tokenValue)} SEI...`).start();

    const toBase64 = (obj: Record<string, unknown>) => {
        return Buffer.from(JSON.stringify(obj)).toString("base64");
    };

    const sellMsgInner = {
        swap: {
            max_spread: "0.49"
        }
    }
    const sellMsgBase64 = toBase64(sellMsgInner)

    const sellMsg = {
        send: {
            contract: pool,
            amount: amount.toString(),
            msg: sellMsgBase64
        }
    }

    const mintReceipt = await client.execute(wallet, tokenContract, sellMsg, "auto", "sniping bot by 0xpeppermint", []);

    if (mintReceipt && mintReceipt.transactionHash) {
        
    }

    spinner.succeed(`jeeted ${amount/1000000} tokens for ${Math.round(percentToSell/100 * tokenValue)} SEI...`);
    console.log("tx_hash: " + chalk.green(mintReceipt.transactionHash));

}


const main = () => {

    program
        .name("seidemon")
        .description("Seidemon 2000 by 0xpeppermint is a modified Lighthouse repo that lets you snipe and sell SEI coins")
        .version("2000")

    program
        .command("load-wallet")
        .description("Load a wallet from a mnemonic")
        .action(async () => {
            let wallet = await inquirer.prompt([
                {
                    type: "input",
                    name: "wallet",
                    message: "What is the mnemonic keyphrase of the address you want to use in lighthouse?"
                }
            ])

            if (fs.existsSync("./config.json")) {
                let config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))
                config.mnemonic = wallet.wallet
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4))
            } else {
                let config = {
                    mnemonic: wallet.wallet
                }
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4))
            }

            console.log(chalk.green("Saved to config.json"))
        })

    program
        .command("load-rpc")
        .description("Load a wallet from a mnemonic")
        .action(async () => {
            let rpc = await inquirer.prompt([
                {
                    type: "input",
                    name: "rpc",
                    message: "What is the RPC you want to use"
                }
            ])

            if (fs.existsSync("./config.json")) {
                let config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))
                config.rpc = rpc.rpc
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4))
            } else {
                let config = {
                    rpc: rpc.rpc
                }
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4))
            }

            console.log(chalk.green("Saved to config.json"))
        })

    program
        .command("load-network")
        .description("Select available network to use")
        .action(async () => {
            let network = await inquirer.prompt([
                {
                    type: "list",
                    name: "network",
                    message: "What is the network you want to use? (pacific-1 is the mainnet, atlantic-2 is the testnet)",
                    choices: ['pacific-1', 'atlantic-2']
                }
            ])

            if (fs.existsSync("./config.json")) {
                let config = JSON.parse(fs.readFileSync("./config.json", "utf-8"))
                config.network = network.network
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4))
            } else {
                let config = {
                    network: network.network
                }
                fs.writeFileSync("./config.json", JSON.stringify(config, null, 4))
            }

            console.log(chalk.green("Saved to config.json"))
        })


    program
        .command("snipe")
        .description("snipe SEI coins using pool address")
        .option("--gas-price <gas_price>", "Gas price to use for transaction (default: 0.15)")
        .action(async (options) => {


            const nextAction = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'What do you want to do next?',
                    choices: ['Snipe', 'Check Value/Sell']
                }
            ]);
            var tokenName = "N/A"
            var tokenContract = "0x"
            if (nextAction.action === 'Snipe') {

                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'pool',
                        message: 'Enter pool address:',
                        validate: input => input ? true : 'Pool address is required'
                    },
                    {
                        type: 'input',
                        name: 'valueInSEI',
                        message: 'Enter amount to snipe in SEI:',
                        validate: input => input && !isNaN(input) ? true : 'enter a valid number'
                    }
                ]);

                let config = loadConfig();

                const wallet = await DirectSecp256k1HdWallet.fromMnemonic(config.mnemonic, {
                    prefix: "sei",
                });
                const [firstAccount] = await wallet.getAccounts();

                const client = await SigningCosmWasmClient.connectWithSigner(config.rpc, wallet, {
                    gasPrice: GasPrice.fromString(options.gasPrice ? options.gasPrice + "usei" : "0.57usei")
                });
                const valueInUsei = new BigNumber(answers.valueInSEI).multipliedBy(new BigNumber("1e6")).toFixed().toString();

                while (true) {
                    try {
                        const pairResponse = await client.queryContractSmart(answers.pool || '', { pair: {} });

                        if (pairResponse.asset_infos[0].token) {
                            tokenContract = pairResponse.asset_infos[0].token.contract_addr;
                        } 
                        else if (pairResponse.asset_infos[1].token) {
                            tokenContract = pairResponse.asset_infos[1].token.contract_addr;
                        }
                        break;

                    } catch (error) {
                        console.log(chalk.red("Error! Address provided is likely not a valid pool!"));
                        const newPool = await inquirer.prompt([
                            {
                                type: 'input',
                                name: 'pool',
                                message: 'Enter pool address:',
                                validate: input => input ? true : 'Pool address is required'
                            }
                        ]);
                        answers.pool = newPool.pool;
                    }
                }

                try {
                    let infoResponse = await client.queryContractSmart(tokenContract, { token_info: {}})
                    tokenName = infoResponse.name;    
                }   catch (error) {
                    console.log(error)
                }
                

                var pnl = Number(0)
                let balanceResponse = await client.getBalance(firstAccount.address, "usei");
                var initialBalance = Math.round(Number(balanceResponse.amount)/1000000);
                var currentBalance = 0

                console.log(chalk.grey("---------------------------------"))
                console.log(chalk.green(`SEI balance: ` + initialBalance + " SEI"))

                await simulate(answers.pool, valueInUsei, client, firstAccount.address, tokenName,
                    async (result) => {
                        await signAndBroadcast(answers.pool, valueInUsei, client, firstAccount.address, tokenName);
                    }
                );

                await new Promise(resolve => setTimeout(resolve, 1.5));
                var result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);
                var tokenBalance = result.tokenBalance
                var tokenValue = result.tokenValue

                while (true) {

                    const nextAction = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'action',
                            message: 'What do you want to do next?',
                            choices: ['Refresh', 'Sell %']
                        }
                    ]);

                    if (nextAction.action === 'Refresh') {
                        result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);

                        tokenBalance = result.tokenBalance
                        tokenValue = result.tokenValue


                    } else if (nextAction.action === 'Sell %') {

                        result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);

                        tokenBalance = result.tokenBalance
                        tokenValue = result.tokenValue

                        const sellInfo = await inquirer.prompt([
                            {
                                type: 'input',
                                name: 'percent',
                                message: 'Enter the percentage of tokens you want to sell:',
                                validate: input => !isNaN(input) && input > 0 && input <= 100 ? true : 'Please enter a valid percentage (1-100)'
                            }
                        ]);



                        const percentToSell = parseFloat(sellInfo.percent);
                        const tokensToSell = Math.ceil(parseFloat(tokenBalance) * (percentToSell * 100 / 10000));

                        await sell(answers.pool, tokensToSell, client, firstAccount.address, tokenValue, percentToSell, tokenContract)
                        result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);

                        tokenBalance = result.tokenBalance
                        tokenValue = result.tokenValue

                    }
                }


            } else if (nextAction.action === 'Check Value/Sell') {

                const answers = await inquirer.prompt([
                    {
                        type: 'input',
                        name: 'pool',
                        message: 'Enter pool address:',
                        validate: input => input ? true : 'Pool address is required'
                    }
                ]);

                let config = loadConfig();

                const wallet = await DirectSecp256k1HdWallet.fromMnemonic(config.mnemonic, {
                    prefix: "sei",
                });
                const [firstAccount] = await wallet.getAccounts();

                const client = await SigningCosmWasmClient.connectWithSigner(config.rpc, wallet, {
                    gasPrice: GasPrice.fromString(options.gasPrice ? options.gasPrice + "usei" : "0.88usei")
                });

                while (true) {
                    try {
                        const pairResponse = await client.queryContractSmart(answers.pool || '', { pair: {} });

                        if (pairResponse.asset_infos[0].token) {
                            tokenContract = pairResponse.asset_infos[0].token.contract_addr;
                        } 
                        else if (pairResponse.asset_infos[1].token) {
                            tokenContract = pairResponse.asset_infos[1].token.contract_addr;
                        }
                        break;

                    } catch (error) {
                        console.log(chalk.red("Error! Address provided is likely not a valid pool!"));
                        const newPool = await inquirer.prompt([
                            {
                                type: 'input',
                                name: 'pool',
                                message: 'Enter pool address:',
                                validate: input => input ? true : 'Pool address is required'
                            }
                        ]);
                        answers.pool = newPool.pool;
                    }
                }

                try {
                    let infoResponse = await client.queryContractSmart(tokenContract, { token_info: {}})
                    tokenName = infoResponse.name;    
                }   catch (error) {
                    console.log(error)
                }

                let balanceResponse = await client.getBalance(firstAccount.address, "usei");
                var initialBalance = Math.round(Number(balanceResponse.amount)/1000000);

                result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);

                tokenBalance = result.tokenBalance
                tokenValue = result.tokenValue


                while (true) {

                    const nextAction = await inquirer.prompt([
                        {
                            type: 'list',
                            name: 'action',
                            message: 'What do you want to do next?',
                            choices: ['Refresh', 'Sell %']
                        }
                    ]);

                    if (nextAction.action === 'Refresh') {
                        result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);

                        tokenBalance = result.tokenBalance
                        tokenValue = result.tokenValue


                    } else if (nextAction.action === 'Sell %') {

                        result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);

                        tokenBalance = result.tokenBalance
                        tokenValue = result.tokenValue


                        const sellInfo = await inquirer.prompt([
                            {
                                type: 'input',
                                name: 'percent',
                                message: 'Enter the percentage of tokens you want to sell:',
                                validate: input => !isNaN(input) && input > 0 && input <= 100 ? true : 'Please enter a valid percentage (1-100)'
                            }
                        ]);

                        const percentToSell = parseFloat(sellInfo.percent);
                        const tokensToSell = Math.ceil(parseFloat(tokenBalance) * (percentToSell * 100 / 10000));

                        console.log(chalk.green(`selling ${tokensToSell/1000000} tokens`));

                        await sell(answers.pool, tokensToSell, client, firstAccount.address, tokenValue, percentToSell, tokenContract)
                        result = await getValue(answers.pool, client, firstAccount.address, initialBalance, tokenName, tokenContract);

                        tokenBalance = result.tokenBalance
                        tokenValue = result.tokenValue

                    }
                }

            }
        })

    program.parse()

}

main();

