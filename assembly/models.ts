import {
    context,
    storage,
    PersistentMap,
    PersistentSet,
    ContractPromise,
    u128,
    PersistentVector
} from "near-sdk-as";

export type Timestamp = u64;
export type TokenId = string;
export type LeaderboardId = string;
export type VoteCount = i32;
export type AccountId = string;
export type DuelId = string;
export type AmbassadorId = string;
export const NANO_FROM_S:Timestamp = 1000000000;
export const NANO_FROM_MS:Timestamp = 1000000;
export const MAX_OPPONENTS = 10;
export const PROFILE_NAME_MAX_LENGTH = 26;
export const PROFILE_TAGLINE_MAX_LENGTH = 33;
const ONE_SKILL:u64 = 1000000000;
const MINT_LEVEL_UNLOCK:u64 = 5;
//Shortened for testing
export const VOTE_COOLDOWN:Timestamp = 12 * NANO_FROM_S;

export const NFT_CONTRACT_ID = 'alpha.allskillsnfttest.testnet';
export const FT_CONTRACT_ID = "alphatokens.allskills.testnet"
const WINNER_CUT = 0.1
const LEADERBOARD_LENGTH = 60 * 60 * 24 * 1 * NANO_FROM_S
const MAX_CHALLENGE_LENGTH = 60 * 60 * 24 * 30 * NANO_FROM_S
const OVERTIME:Timestamp = 600 * NANO_FROM_S
const DEFAULT_PROFILE = "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2aWV3Qm94PSItMi42MTYgLTMuNzAxIDQyMS4zNTEgNDIyLjYxMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZWxsaXBzZSBzdHlsZT0ic3Ryb2tlOiByZ2IoMCwgMCwgMCk7IHN0cm9rZS13aWR0aDogM3B4OyIgY3g9IjIwOC44NTMiIGN5PSIyMDguOTE0IiByeD0iMjA2LjkxNCIgcnk9IjIwNi45MTQiLz4KICA8ZyBmaWxsPSIjNkNDIiBzdHJva2Utd2lkdGg9IjAiIHRyYW5zZm9ybT0ibWF0cml4KDEuMjE1ODEsIDAsIDAsIDEuMjE1ODEsIC0xMDcxLjA1MDY1OSwgLTQ4My45MDkyNDEpIiBzdHlsZT0iIj4KICAgIDxwYXRoIGQ9Ik0gMTA2OS4yIDQ5My41IEwgMTA3Ny41IDUxMCBDIDEwNzcuNSA1MTAgMTEwMS4zIDUxMC4zIDExMTIgNTEwLjMgTCAxMTMxLjUgNTEwLjQgTCAxMTMxLjggNDkzLjcgTCAxMTMyIDQ3NyBMIDEwNjEgNDc3IEwgMTA2OS4yIDQ5My41IFogTSAxMDQwLjQgNDk2LjIgTCAxMDMxLjMgNTE0LjUgTCAxMDU3LjEgNTY2LjIgTCAxMDgzIDYxOCBMIDEwMjguMiA2MTggTCAxMDIwLjMgNjMzLjcgQyAxMDE2IDY0Mi4zIDEwMTIuNCA2NDkuNyAxMDEyLjIgNjUwLjIgQyAxMDEyIDY1MC42IDEwNDAgNjUxIDEwNzQuNCA2NTEgTCAxMTM3IDY1MSBMIDEwOTMuOCA1NjQuNSBDIDEwNzAgNTE2LjkgMTA1MC4zIDQ3OCAxMDUwIDQ3OCBDIDEwNDkuNyA0NzggMTA0NS40IDQ4Ni4yIDEwNDAuNCA0OTYuMiBaIiBzdHlsZT0icGFpbnQtb3JkZXI6IGZpbGw7IGZpbGw6IHJnYigwLCAyNTUsIDIzNCk7Ii8+CiAgICA8cGF0aCBkPSJNIDEwMjYuNyA1MjguNSBDIDEwMjUuMyA1MjYuNyA5NjMgNjUxIDk2MyA2NTEgTCAxMDAwLjUgNjUxIEwgMTAyMi40IDYwNy4yIEwgMTA0NC4zIDU2My40IEwgMTAzNi4yIDU0Ni45IEMgMTAzMS44IDUzNy45IDEwMjcuNSA1MjkuNiAxMDI2LjcgNTI4LjUgWiIgc3R5bGU9InBhaW50LW9yZGVyOiBmaWxsOyBmaWxsOiByZ2IoMCwgMjU1LCAyMjkpOyIvPgogIDwvZz4KPC9zdmc+"
 
@nearBindgen
export class UploadedNFT {
    playback_id: string;
    cid: string;
    provider: string;
    filename: string;
}

@nearBindgen
export class MintResponse {
    id: string;
    token_id: string;
    account_id:string;
    data: UploadedNFT;
}
@nearBindgen
export class MintNFT {
    token_id: string;
    metadata: MintNFTMetadata;
    receiver_id: string;
    perpetual_royalties: Map<AccountId, u32>;
}

@nearBindgen
export class MintNFTMetadata {
    title: string;
    description: string;
    extra: string;
    media:string;
}

@nearBindgen
export class NFTTokenMetadata {
    title: string;
    description: string;
    media: string;
    media_hash: string;
    copies: string;
    issued_at: string;
    expires_at: string;
    starts_at: string;
    updated_at: string;
    extra: string;
    reference: string;
    reference_hash: string;
}
@nearBindgen
export class ChallengeSubmission {
    target_token_id: string;
    caller: string;
}
@nearBindgen
export class Challenger {
    constructor(
        public creator: string,
        public token_id: string,
        public title:string,
        public media: string,
        public thumbnail: string,
    ) {}
}
@nearBindgen
export class OpenChallengeSubmission {
    token_id: string;
    caller: string;
}
@nearBindgen
export class OpenChallenge {
    challengers: Map<TokenId,Challenger> = new Map<TokenId,Challenger>();
    constructor(
        public creator: string,
        public token_id: string,
        public title: string,
        public media: string,
        public thumbnail: string,
        public created_at: Timestamp,
    ) {}

    
}
@nearBindgen
export class NFTToken {
    token_id: string;
    owner_id: AccountId;
    metadata: NFTTokenMetadata;
    approved_account_ids: Map<AccountId,u64>;
    royalty:  Map<AccountId,u32>;
}

@nearBindgen
export class ClaimId {
    id: DuelId;
    sender: AccountId;
    claimWinnings: Winnings;
}

@nearBindgen
export class ChallengeAttempt {
    creatorAccount: AccountId;
    creatorAssetId: string;
    targetAccount: AccountId;
    targetAssetId: string;
}
@nearBindgen
export class DuelLeaderboard {
    size: number = 10;
    leaders: Array<LeaderboardEntry> = [];
    constructor(
        public id: LeaderboardId,
        public idOfPreviousLeaderboard: LeaderboardId,
        public start_time: Timestamp,
        public end_time: Timestamp,
    ) {}
}
@nearBindgen
export class LeaderboardEntry {
    constructor(
        public score: u64,
        public id: DuelId
    ) {}
}

@nearBindgen
export class FTTransferPayout {
    receiver_id: string;
    amount: string;
}
@nearBindgen
export class Winnings {
    claimed_at: Timestamp;
    constructor(
        public amount: string,
        public claimed: boolean,
        public created: Timestamp,
        public source: DuelId,
        public from: string,
    ) {}

}
@nearBindgen
export class StorageDeposit {
    account_id: string;
}

@nearBindgen
export class Profile {
    wins: u64 = 0;
    level: u64 = 1;
    losses: u64 = 0;
    gmActive: boolean = false;
    followers: AccountId[] = [];
    mintableAssets: DuelId[] = [];
    readyToMint: Map<DuelId, UploadedNFT> = new Map<DuelId, UploadedNFT>();
    mintedAssets: Set<TokenId> = new Set<TokenId>();
    assetsOwned: string[] = [];
    pendingChallenges: Map<TokenId, u32> = new Map<TokenId, u32>();
    activeDuels: Set<DuelId> = new Set();
    completedDuels: Set<DuelId> = new Set();
    following: AccountId[] = [];
    earnings: u64 = 0;
    claimedWinnings: Map<DuelId, Winnings> = new Map<DuelId, Winnings>();
    unclaimedWinnings: Array<Winnings> = []
    constructor(
        public wallet: AccountId,
        public name: string,
        public avatar: string = DEFAULT_PROFILE,
        public tagline: string = "Tag line",
        public nationality: string = "ca"
    ) {}
}

@nearBindgen
export class PayoutArgs {
    constructor(
        public receiver_id: AccountId,
        public amount: string,
    ) {}
}

@nearBindgen
export class DuelData {
    constructor(
        public id: string,
        public active: bool,
        public winner: AccountId,
        public opponents: Array<Opponent>,
        public ended_at: Timestamp = 0
    ) {}
}
@nearBindgen
export class VotesReceived {
    constructor(
        public id: string,
        public votes_received: number,
        public ended_at: Timestamp = 0
    ) {}
}

//Holds count of total votes received and a map of the vote count of each user that voted for it
@nearBindgen
export class Opponent {
    voteScore: VoteCount = 0;
    voters: Map<AccountId,VoteCount> = new Map<AccountId, VoteCount>();
    token_id: TokenId;
    constructor(
        public title: string,
        public data: string,
        public account: AccountId,
        public thumbnail: string,
    ) {}
}
@nearBindgen
export class AmbassadorChallenge {
    active: bool;
    winners: Opponent[];
    overtime: bool = false;
    totalVotes: i32 = 0;
    poolDistribution: Map<AccountId, f64> = new Map<AccountId, f64>();
    opponents: Map<AccountId, Opponent> = new Map<AccountId, Opponent>();
    constructor(
        public id: AmbassadorId,
        public created_at: Timestamp,
        public ambassador: AccountId,
        public length: u64,
        public data: string,
        public thumbnail: string,
        public rewards: Array<string>,
    ) {}
    static create(id: AmbassadorId, ambassador: AccountId, lenInSeconds: u64, data: string, thumbnail: string, rewards: Array<string>): void {
        assert(thumbnail.length > 0, "Must contain thumbnail")
        assert(data.length > 0, "Must contain data")
        assert(lenInSeconds < MAX_CHALLENGE_LENGTH, "Length too long")
        const challenge = new AmbassadorChallenge(id, context.blockTimestamp, ambassador, lenInSeconds * NANO_FROM_S, data, thumbnail, rewards)
        challenge.active = true;
        challengeIds.add(id)
        challenges.set(id, challenge)
    }
    submit_attempt(opponent: Opponent): string | null {
        const challenge = this;
        if (challenge.opponents.has(context.sender)) {
            return "Already submitted an attempt"
        }
        challenge.opponents.set(context.sender, opponent)
        this.set(challenge)
        return "Success"
    }
    vote_for(voter: string, receiver: AccountId): string | null {
        const challenge = this
        const opponent = challenge.opponents.get(receiver)
        if (opponent) {
            if (opponent.voters.has(voter)) { 
                let voteCount = opponent.voters.get(voter)
                voteCount = voteCount + 1
                opponent.voters.set(voter, voteCount)
            } else {
                opponent.voters.set(voter, 1)
            }  
            opponent.voteScore = opponent.voteScore + 1
            challenge.totalVotes  = challenge.totalVotes + 1
            challenge.opponents.set(receiver, opponent)
            this.set(challenge)
            return "Success"
        } else {
            return "Opponent doesnt't exist"
        }
    }
    //static can_vote() {}
    //static decideWinner() {}
    end(): void {
        const challenge = this
        challenge.active = false;
        this.set(challenge)
    }
    set(challenge: AmbassadorChallenge): void {
        challenges.set(this.id, challenge);
    }
}
//Handles logic for a Duel between X# Opponents, up to MAX_OPPONENTS, decided by votes. Rounds last for X# seconds.
//Users can vote for either opponent, not exclusively, and once per VOTE_COOLDOWN
//If result is a tie, increase round length by OVERTIME
//Once complete, set to inactive and distribute reward pool to winner and voters
@nearBindgen
export class Duel {
    active: bool;
    winner: Opponent;
    overtime: bool = false;
    mode:string;
    totalVotes: i32 = 0;
    poolDistribution: Map<AccountId, f64> = new Map<AccountId, f64>();
    constructor(
        public id: DuelId,
        public created_at: Timestamp,
        public opponents: Map<AccountId, Opponent>,
        public roundLength: u64,
        public numOpponents: i32,
    ) {}
    static create(id: DuelId, challengers: Map<AccountId, Opponent>, lenInSeconds: u64): void {
        let numOpponents = 2
        assert(numOpponents < MAX_OPPONENTS, "Too many opponents")
        //let opponents = new PersistentMap<DuelId, Map<AccountId, Opponent>>(id)
        //opponents.set(id, challengers)
        const duel = new Duel(id, context.blockTimestamp, challengers, lenInSeconds * NANO_FROM_S, numOpponents)
        duel.active = true;
        //duel.set(duel)
       //let accountIds = challengers.keys()
        duelIds.add(id);
        activeDuels.add(id);
        duels.set(id, duel);  
    }
    vote_for(voter: string, receiver: AccountId): string {
        //Checks if duel is active, if it should be inactivated, if opponent exists, and if user can vote
        assert(this.active, "This duel is no longer active")
        if(!this.shouldBeActive()) return "Winner already decided: " + this.winner.account
        const duel = this
        assert(duel.opponents.has(receiver), "Opponent doesn't exist.")
        const opponent = duel.opponents.get(receiver)
        assert(this.canVote(voter), "You must wait longer to vote again.")
        //if voter has already voted, increase their vote count by 1
        if (opponent.voters.has(voter)) { 
            let voteCount = opponent.voters.get(voter)
            voteCount = voteCount + 1
            opponent.voters.set(voter, voteCount)
        //else add voter
        } else {
            opponent.voters.set(voter, 1)
        }
        //increase voteScore and totalVotes, save opponents/duel/voterHistory
        opponent.voteScore = opponent.voteScore + 1
        duel.totalVotes  = duel.totalVotes + 1
        duel.opponents.set(receiver, opponent)
        this.set(duel)
        //Used to track times of votes to check if voter cooldown is up
        voterHistory.set(voter, context.blockTimestamp)
        return "Vote accepted"
    }
    canVote(voter: AccountId): bool {
        //More logic to verify if user can vote can go here
        if (voterHistory.contains(voter)) {
            //let lastVoted = voterHistory.getSome(voter)
            return true
            //return this.isLaterThan(lastVoted, VOTE_COOLDOWN)
        } else {
            return true
        }     
    }
    shouldBeActive(): bool {
        //Checks if the time since start of duel is longer than roundLength then checks for winner
        let laterThan = this.isLaterThan(this.created_at, this.roundLength)
        if (laterThan) {
            return !this.end()
        }
        return true
    }
    //Checks if now is later than the given start time and duration
    isLaterThan(time: u64, duration: u64): bool {
        const now = context.blockTimestamp
        const timeDiff = now - time
        if (timeDiff > duration) {
            assert(timeDiff > duration, timeDiff.toString())
            return true
        } else {
            assert(timeDiff < duration, timeDiff.toString())
            return false
        }
    }
    //Checks for winner, if more than 1 winner (tie) then engage overtime
    winnerDecided(): bool {
        const duel = this


        let winner: Array<Opponent> = []
        let highest = 0
        let opponentIDs = this.opponents.keys()
        for (let i = 0; i < this.opponents.size; i++) {
            //assert(duel.opponents.has(opponentIDs[i]), "Opponent missing?")
            let op = duel.opponents.get(opponentIDs[i])
            if (op.voteScore > highest) {
                winner = [op]
                highest = op.voteScore
            } else if (op.voteScore == highest) {
                winner.push(op)
            } else {
                if (profiles.contains(op.account)) {
                    let profile = profiles.getSome(op.account)
                    profile.losses += 1
                    profiles.set(op.account, profile)
                }
            }
        }
        //Can add system to handle multiple winners/ties, for now only engages overtime
        if (winner.length > 1) {
            this.engageOvertime()
            return false
        } else {
            duel.winner = winner[0]
            this.set(duel)
            if (profiles.contains(winner[0].account)) {
                let profile = profiles.getSome(winner[0].account)
                profile.wins += 1
                if (profile.wins >= profile.level*(profile.level + 1) / 2) {
                    profile.level += 1;
                }
                if (profile.level >= MINT_LEVEL_UNLOCK && winner[0].token_id == null ) {
                    profile.mintableAssets.push(duel.id)
                }
                profiles.set(winner[0].account, profile)
            }
            return true
        }
    }
    engageOvertime(): void {
        const duel = this
        duel.roundLength = duel.roundLength + OVERTIME
        duel.overtime = true
        this.set(duel)
    }
    end(): bool {
        //More logic to handle end of duel can go here
        const ended = this.winnerDecided()
        if(ended === true) {
            const duel = this
            duel.active = false
            duel.set(duel)
            if (activeDuels.has(duel.id)) {
                activeDuels.delete(duel.id)      
            }
            let opponentProfiles = duel.opponents.keys()
            for (let i=0;i<opponentProfiles.length;i++) {
                let accountId = opponentProfiles[i]
                let profile = profiles.get(accountId)
                let opponent = duel.opponents.get(accountId)
                if (opponent.token_id != null) {

                }
                if (profile) {
                    profile.completedDuels.add(duel.id)
                    profile.activeDuels.delete(duel.id)
                    profiles.set(accountId, profile)
                }
            }
            completedDuels.add(duel.id)
            if (duelLeaderboardHistory.isEmpty) {
                let newLeaderboard = new DuelLeaderboard(context.blockTimestamp.toString(),'none',context.blockTimestamp, context.blockTimestamp + LEADERBOARD_LENGTH)
                duelLeaderboardHistory.push(newLeaderboard)
            }
            let leaderboard = duelLeaderboardHistory.back
            if (context.blockTimestamp > leaderboard.end_time) {
                let newLeaderboard = new DuelLeaderboard(context.blockTimestamp.toString(),leaderboard.id,context.blockTimestamp, context.blockTimestamp + LEADERBOARD_LENGTH)
                duelLeaderboardHistory.push(newLeaderboard)
                leaderboard = newLeaderboard
            }
             //if duel votes > last entry in leaderboard, add new entry, sort leaderboard, pop last entry
            if (leaderboard.leaders.length < leaderboard.size) {
                let entry = new LeaderboardEntry(duel.totalVotes, duel.id)
                leaderboard.leaders.push(entry)
            } else if (leaderboard.leaders.length >= leaderboard.size && duel.totalVotes > i32(leaderboard.leaders[leaderboard.leaders.length - 1].score)) {
                let entry = new LeaderboardEntry(duel.totalVotes, duel.id)
                leaderboard.leaders.push(entry)
                leaderboard.leaders.sort((a, b) => i32(a.score - b.score))
                leaderboard.leaders.pop()
            }
            duelLeaderboardHistory.replace(duelLeaderboardHistory.length - 1, leaderboard)
            duel.distributePool();
            if (duel.opponents.values()[0].token_id != null) {
                let opponents = duel.opponents.keys()
                let activeTokens = tokensInActiveDuel.get("general")
                if (activeTokens) {
                    for (let i = 0; i < opponents.length; i++) {
                        let token_id = duel.opponents.get(opponents[i]).token_id
                        let index = activeTokens.indexOf(token_id)
                        activeTokens.splice(index,1)
                    }
                    tokensInActiveDuel.set("general", activeTokens)
                }
            }
            return true
        }

        return false
    }
    //Calculates share the winner receives, and each voter receives, and sets poolDistribution
    distributePool(): void {
        const duel = this
        assert(duel.active === false, "Duel is still active")
        assert(duel.winner !== null, "Winner not decided?")
        //One improvement would be a sliding scale for WINNER_CUT, closer the votes = bigger cut
        let winnerShare = duel.totalVotes * WINNER_CUT 
        let winner = duel.winner.account
        duel.poolDistribution.set(duel.winner.account.toString(), winnerShare)
        let votersOfWinner = duel.winner.voters
        let voterSharePerPoint = ((duel.totalVotes - winnerShare) / duel.winner.voteScore)
        let voterIds = votersOfWinner.keys()
        let newWinnings = new Winnings("300000000000", false, context.blockTimestamp, duel.id, "winning")
        let profile = profiles.get(winner);
        if (winnings.contains(winner)) {
            let winningsMap = winnings.getSome(winner)
            if (!winningsMap.has(duel.id)) {
                winningsMap.set(duel.id,newWinnings)
                winnings.set(winner, winningsMap)
            }
        } else {
            let winningsMap = new Map<string, Winnings>()
            winningsMap.set(duel.id, newWinnings);
            winnings.set(winner, winningsMap)
        }
        for (let i = 0; i < votersOfWinner.size; i++){
            let voter = voterIds[i]
            let voteCount = votersOfWinner.get(voter)
            let voterShare = voteCount * voterSharePerPoint
            duel.poolDistribution.set(voter, voterShare)
            let voterWinnings = new Winnings("100000000000", false, context.blockTimestamp, duel.id, "voting")
            let winningsMap: Map<string, Winnings>
            if (winnings.contains(voter)) {
                winningsMap = winnings.getSome(voter)
                if (!winningsMap.has(duel.id)) {
                    winningsMap.set(duel.id,voterWinnings)
                }
            } else {
                winningsMap = new Map<string, Winnings>()
                winningsMap.set(duel.id, voterWinnings);
            }
            winnings.set(voter, winningsMap)
        };
        this.set(duel)
    }
    get_total_votes(): i32 {
        const duel = this
        return duel.totalVotes
    }
    get_vote_count_for(receiver: AccountId): i32 {
        const duel = this
        assert(duel.opponents.has(receiver), "Opponent doesn't exist.")
        const votes = duel.opponents.get(receiver).voteScore
        return votes
    }
    get(id:DuelId): Duel {
        return storage.getSome<Duel>("state")
    }
    set(duel: Duel): void {
        duels.set(this.id, duel);
    }
}
@nearBindgen
export class OpenChallenges {
    challenges: Map<TokenId, OpenChallenge> = new Map<TokenId, OpenChallenge>()
}
//on duel end, check if time < leaderboard end time
//if yes, check if duel belongs in leaderboard
//if yes add duel to leaderboard
//if time > leaderboard end time
//new duelleaderboard
export const tokensInActiveDuel = new PersistentMap<string,Array<TokenId>>("activeTokens")
export const openChallengesByType = new PersistentMap<string, OpenChallenges>("openByType")
//export const openChallenges = new PersistentMap<TokenId, OpenChallenge>("openChallenges")
//export const openChallengeIds = new PersistentSet<TokenId>("openIds")
export const duelLeaderboardHistory = new PersistentVector<DuelLeaderboard>("duel_leaderboards")
export const whitelist = new PersistentSet<AccountId>("whitelist");
export const opIDs = new PersistentSet<AccountId>("ops");
export const owners = new PersistentSet<AccountId>("admin")
export const duelIds = new PersistentSet<DuelId>("ids");
export const duels = new PersistentMap<DuelId,Duel>("duels");
export const challengeIds = new PersistentSet<AmbassadorId>("challengeIds");
export const challenges = new PersistentMap<DuelId,AmbassadorChallenge>("challenges");
export const profiles = new PersistentMap<AccountId,Profile>("profiles");
export const profileIds = new PersistentSet<AccountId>("pIds");
export const activeDuels = new PersistentSet<DuelId>("activeDuels")
export const completedDuels = new PersistentSet<DuelId>("doneDuels")
export const nationalities = new PersistentSet<string>("na")
export const winnings = new PersistentMap<AccountId,Map<DuelId,Winnings>>("winnings");
//account: {$duelID: {amount: "", claimed: boolean},}
//connect DuelId with opponent names
export const duelIdsMap = new PersistentMap<AccountId,Set<DuelId>>("duelMap");
//duels.
const voterHistory = new PersistentMap<AccountId, Timestamp>("voters");