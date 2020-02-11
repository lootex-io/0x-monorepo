import { artifacts as assetProxyArtifacts } from '@0x/contracts-asset-proxy';
import { CurveBridgeContract } from '@0x/contracts-asset-proxy/lib/src/wrappers';
import { ERC20TokenContract } from '@0x/contracts-erc20';
import { blockchainTests, constants, describe, toBaseUnitAmount } from '@0x/contracts-test-utils';
import { AbiEncoder } from '@0x/utils';

blockchainTests.fork.skip('Mainnet curve bridge tests', env => {
    let testContract: CurveBridgeContract;
    const receiver = '0x986ccf5234d9cfbb25246f1a5bfa51f4ccfcb308';
    const usdcWallet = '0xF977814e90dA44bFA03b6295A0616a897441aceC';
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const daiWallet = '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b';
    const daiAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
    before(async () => {
        testContract = await CurveBridgeContract.deployAsync(
            assetProxyArtifacts.CurveBridge.compilerOutput.evm.bytecode.object,
            CurveBridgeContract.ABI(),
            env.provider,
            { ...env.txDefaults, from: daiWallet },
            {},
        );
    });

    describe('bridgeTransferFrom()', () => {
        it('succeeds exchanges DAI for USDC', async () => {
            const bridgeDataEncoder = AbiEncoder.create([{ name: 'fromTokenAddress', type: 'address' }]);
            const bridgeData = bridgeDataEncoder.encode([daiAddress]);
            // Fund the Bridge
            const dai = new ERC20TokenContract(daiAddress, env.provider, { ...env.txDefaults, from: daiWallet });
            await dai
                .transfer(testContract.address, toBaseUnitAmount(1))
                .awaitTransactionSuccessAsync({ from: daiWallet }, { shouldValidate: false });
            // Exchange via Curve
            await testContract
                .bridgeTransferFrom(usdcAddress, constants.NULL_ADDRESS, receiver, constants.ZERO_AMOUNT, bridgeData)
                .awaitTransactionSuccessAsync({ from: daiWallet, gasPrice: 1 }, { shouldValidate: false });
        });
        it('succeeds exchanges USDC for DAI', async () => {
            const bridgeDataEncoder = AbiEncoder.create([{ name: 'fromTokenAddress', type: 'address' }]);
            const bridgeData = bridgeDataEncoder.encode([usdcAddress]);
            // Fund the Bridge
            const usdc = new ERC20TokenContract(usdcAddress, env.provider, { ...env.txDefaults, from: usdcWallet });
            await usdc
                .transfer(testContract.address, toBaseUnitAmount(1, 6))
                .awaitTransactionSuccessAsync({ from: usdcWallet }, { shouldValidate: false });
            // Exchange via Curve
            await testContract
                .bridgeTransferFrom(daiAddress, constants.NULL_ADDRESS, receiver, constants.ZERO_AMOUNT, bridgeData)
                .awaitTransactionSuccessAsync({ from: usdcWallet , gasPrice: 1 }, { shouldValidate: false });
        });
    });
});