import {
  NET_ARBITRUM_GOERLI,
  NET_BASE,
  NET_BASE_GOERLI,
  NET_BNB,
  NET_BNB_TEST,
  NET_ETHEREUM,
  NET_GOERLI,
  NET_LINEA,
  NET_LINEA_GOERLI,
  NET_MANTA_PACIFIC,
  NET_MANTA_PACIFIC_TEST,
  NET_MANTLE,
  NET_MANTLE_TEST,
} from '../../../constant/network';
import { NetworkConfPartialMap } from '../../../constant/network-type';
import { envSelect, ExeEnv } from './const-var';

export const STONE_CONFIG_KEYS = [
  'stoneVault',
  'stoneToken',
  'strategyController',
  'strategy',
  'proposal',
  'minter',
  'ethOracle',

  'nft',
] as const;
export type StoneConfigFields = typeof STONE_CONFIG_KEYS[number];
export type StoneContractConfig = { [k in StoneConfigFields]: string };

// ---------------------------------------------------------------------------------------------------------------------
// Contract Addresses for each Network

const STONE_ADDRESS_PROD: NetworkConfPartialMap<StoneContractConfig> = {
  [NET_ETHEREUM]: {
    stoneToken: '0x7122985656e38BDC0302Db86685bb972b145bD3C',
    stoneVault: '0xA62F9C5af106FeEE069F38dE51098D9d81B90572',
    proposal: '0x3aa0670E24Cb122e1d5307Ed74b0c44d619aFF9b',
    strategyController: '0x396aBF9fF46E21694F4eF01ca77C6d7893A017B2',
    minter: '0xEc306E46549A7E8f4fCE823D3058f2D134133B17',
    ethOracle: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // chain link

    strategy: '',
    nft: '0x129e49c0399E3C932D34c3b76A598214b5B82cf9',
  },
  [NET_LINEA]: {
    stoneToken: '0x93F4d0ab6a8B4271f4a28Db399b5E30612D21116',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_MANTLE]: {
    stoneToken: '0x2Fde62942759d7C0aaf25952Da4098423bC1264C',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_BASE]: {
    stoneToken: '0xD2012fc1B913cE50732ebcaa7E601fe37Ac728C6',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_BNB]: {
    stoneToken: '0x80137510979822322193FC997d400D5A6C747bf7',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_MANTA_PACIFIC]: {
    stoneToken: '0xEc901DA9c68E90798BbBb74c11406A32A70652C3',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
};
const STONE_ADDRESS_ALPHA: NetworkConfPartialMap<StoneContractConfig> = {
  [NET_ETHEREUM]: {
    stoneToken: '0xD081BE7f329e13c4097cFa3668f1E690Cde9c08d',
    stoneVault: '0xF97C478f34E1dBA7E399b973f4b720bA5885290b',
    proposal: '0xbc84fF8A2F781EB76Febb8558699bba83Acb38Ef',
    strategyController: '0x331dFc50239F09D8B91c2f6fcF594AaA03A35546',
    minter: '0x7f60E63e40e5065E5A48a77010169dE269fc8aB7',
    ethOracle: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // chain link

    strategy: '',
    nft: '0x7356c596e6E0167B251eE80Fb7567C310DD594DE',
  },
  [NET_LINEA]: {
    stoneToken: '0x80137510979822322193FC997d400D5A6C747bf7',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_MANTLE]: {
    stoneToken: '0x80137510979822322193FC997d400D5A6C747bf7',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_BNB]: {
    stoneToken: '0x80137510979822322193FC997d400D5A6C747bf7',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_BASE]: {
    stoneToken: '0xD2012fc1B913cE50732ebcaa7E601fe37Ac728C6',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
};
const STONE_ADDRESS_TEST: NetworkConfPartialMap<StoneContractConfig> = {
  [NET_GOERLI]: {
    stoneToken: '0x1Aff5cd754f271b80b7598d4aA77a4F16363c515',
    stoneVault: '0x19d2b3c75d249fb38dfab17c7aa2326351b64d4b',
    proposal: '0x0d727059de77b3df7fbf27dc388a61fd7152648d',
    strategyController: '0x05B539f203B3B6C151E656331d0218f9f2416777',
    minter: '0x43b43a992142772704a9b71ee533835a8a04aa90',
    ethOracle: '0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e', // chain link

    strategy: '',
    nft: '0x7de4D07AC77a65d9Dc0e3890621b61984F7AA85B',
  },
  [NET_LINEA_GOERLI]: {
    stoneToken: '0x920800a3a0d690d027FC97C09F8C36216481C4a2',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_MANTLE_TEST]: {
    stoneToken: '0xaF18828Dd9D8d0842fAc0C4E72D8f4b25BA66866',

    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_ARBITRUM_GOERLI]: {
    stoneToken: '0x4AE9067a2A01e9610dfAacaF6887BB6B2FE5d177',

    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_BASE_GOERLI]: {
    stoneToken: '0x5d417e7798208E9285b5157498bBF23A23E421E7',

    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_BNB_TEST]: {
    stoneToken: '0x985a3895127E7A09C5b07B37B9F6bf96e9D566FE',

    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
  [NET_MANTA_PACIFIC_TEST]: {
    stoneToken: '0xb99De946229252B32d84e157A4220D4D12939317',
    stoneVault: '',
    proposal: '',
    strategyController: '',
    minter: '',
    ethOracle: '', // chain link

    strategy: '',
    nft: '',
  },
};

export const STONE_ADDRESS: NetworkConfPartialMap<StoneContractConfig> = envSelect({
  [ExeEnv.Prod]: STONE_ADDRESS_PROD,
  [ExeEnv.Alpha]: STONE_ADDRESS_ALPHA,
  [ExeEnv.Test]: STONE_ADDRESS_TEST,
});

// ---------------------------------------------------------------------------------------------------------------------
// For Standard Bridge

const STANDARD_BRIDGE_STONE_PROD: NetworkConfPartialMap<string> = {
  [NET_ETHEREUM]: '0x7122985656e38BDC0302Db86685bb972b145bD3C',
  [NET_MANTA_PACIFIC]: '0x80137510979822322193FC997d400D5A6C747bf7',
};
const STANDARD_BRIDGE_STONE_ALPHA: NetworkConfPartialMap<string> = {
  [NET_ETHEREUM]: '0x7122985656e38BDC0302Db86685bb972b145bD3C',
};
const STANDARD_BRIDGE_STONE_TEST: NetworkConfPartialMap<string> = {
  [NET_GOERLI]: '0x1Aff5cd754f271b80b7598d4aA77a4F16363c515',
  [NET_MANTA_PACIFIC_TEST]: '0x1da4dF975FE40dde074cBF19783928Da7246c515',
};

// standard(official) bridge config
export const STANDARD_BRIDGE: NetworkConfPartialMap<string> = envSelect({
  [ExeEnv.Prod]: STANDARD_BRIDGE_STONE_PROD,
  [ExeEnv.Alpha]: STANDARD_BRIDGE_STONE_ALPHA,
  [ExeEnv.Test]: STANDARD_BRIDGE_STONE_TEST,
});
