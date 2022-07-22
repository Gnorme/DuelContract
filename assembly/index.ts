import {context, storage, PersistentMap, RNG, PersistentSet, math, base64, u128, ContractPromise, ContractPromiseResult, PersistentVector, PersistentDeque} from "near-sdk-as";
import { Duel, AccountId, DuelId, Opponent, MAX_OPPONENTS, Timestamp , Winnings, opIDs, owners, duels, duelIds, DuelData, duelIdsMap, profileIds, Profile, profiles, activeDuels, PROFILE_NAME_MAX_LENGTH, PROFILE_TAGLINE_MAX_LENGTH, nationalities, winnings, FT_CONTRACT_ID, FTTransferPayout, StorageDeposit, ClaimId, AmbassadorChallenge, whitelist, AmbassadorId, challengeIds, challenges, DuelLeaderboard, LeaderboardEntry, duelLeaderboardHistory, VotesReceived, NFTToken, NFT_CONTRACT_ID, OpenChallengeSubmission, ChallengeSubmission, OpenChallenge, Challenger, TokenId, openChallengesByType, OpenChallenges, tokensInActiveDuel, MintNFTMetadata, MintResponse, MintNFT, UploadedNFT} from "./models";
//Comments starting with all-caps words are potential issues that need to be addressed.
const MAX_DUEL_REQUESTS = 20;
@nearBindgen
class ID {
    token_id: string
}
export function init_ambassador_challenge(ambassador: AccountId, data: string, thumbnail: string, lenInSeconds: Timestamp = 1200): string {
    assert(owners.has(context.predecessor), "Only owners can call this function")
    let id = ambassador + "." + context.blockIndex.toString();
    AmbassadorChallenge.create(id, ambassador, lenInSeconds, data, thumbnail, [])
    return id
}
function initGM(submissions: Array<Opponent>,numOpponents: i32, lenInSeconds: Timestamp = 1200): string {
    assert(submissions.length == numOpponents, "Not enough or too many opponents")
    validate_submissions(submissions)
    //createDuel(submissions, numOpponents, lenInSeconds)
    let opponents = new Map<AccountId, Opponent>()
    let duelId: string = submissions[0].token_id
    assert(duelId != null, "token_id field can't be null")
    let generalActiveTokens = tokensInActiveDuel.get("general")
    for (let i = 0; i < numOpponents; i++) {
        opponents.set(submissions[i].account, submissions[i])
        let token_id = submissions[i].token_id
        assert(token_id != null, "token_id field can't be null")
        generalActiveTokens!.push(token_id)
        
        opIDs.add(submissions[i].account)
        if (i > 0) {
            //duelIds are the submission playbackIds combined = easy way to avoid duplicate duels
            duelId = duelId + "+" + submissions[i].token_id
        }  
    }
    //let duelId = generateRandomDNA() + "-" + context.blockIndex.toString()
    assert(!duelIds.has(duelId), "Duel with that id already exists")
    assert(opponents.size == numOpponents, "Something went wrong setting up the opponents")
    //owners.add(context.predecessor)
    let accounts = opponents.keys()
    Duel.create(duelId, opponents, lenInSeconds);
    for (let i = 0; i < opponents.size; i++) {
        let account = accounts[i]
        let profile = profiles.get(account)
        if (profile) {
            profile.activeDuels.add(duelId)
            profiles.set(account, profile)
        }
        let accountDuelIds = duelIdsMap.get(account)
        if (!accountDuelIds) {
            accountDuelIds = new Set();
        }
        accountDuelIds.add(duelId)
        duelIdsMap.set(account, accountDuelIds)
    }
    tokensInActiveDuel.set("general", generalActiveTokens!)
    return duelId;  
}
export function init(submissions: Array<Opponent>,numOpponents: i32, lenInSeconds: Timestamp = 1200): string {
    assert(owners.has(context.predecessor), "Only owners can call this function")
    assert(submissions.length == numOpponents, "Not enough or too many opponents")
    validate_submissions(submissions)
    let opponents = new Map<AccountId, Opponent>()
    let duelId: string = submissions[0].data
    for (let i = 0; i < numOpponents; i++) {
        opponents.set(submissions[i].account, submissions[i])
        opIDs.add(submissions[i].account)
        if (i > 0) {
            //duelIds are the submission playbackIds combined = easy way to avoid duplicate duels
            duelId = duelId + "+" + submissions[i].data
        }  
    }
    //let duelId = generateRandomDNA() + "-" + context.blockIndex.toString()
    assert(!duelIds.has(duelId), "Duel with that id already exists")
    assert(opponents.size == numOpponents, "Something went wrong setting up the opponents")
    //owners.add(context.predecessor)
    let accounts =opponents.keys()
    Duel.create(duelId, opponents, lenInSeconds);
    for (let i = 0; i < opponents.size; i++) {
        let account = accounts[i]
        let profile = profiles.get(account)
        if (profile) {
            profile.activeDuels.add(duelId)
            profiles.set(account, profile)
        }
        let accountDuelIds = duelIdsMap.get(account)
        if (!accountDuelIds) {
            accountDuelIds = new Set();
        }
        accountDuelIds.add(duelId)
        duelIdsMap.set(account, accountDuelIds)
    }
    return duelId;
}

export function return_active_tokens(): Array<string> | null {
    return tokensInActiveDuel.get("general")
}
export function create_challenge_type(type:string): void {
    assert_owner()
    if(!tokensInActiveDuel.contains(type)){
        tokensInActiveDuel.set(type, [])
    }
    if (!openChallengesByType.contains(type)) {
        openChallengesByType.set(type, new OpenChallenges())
    }
}
export function accept_challenge(token_id: TokenId, challenger_id: TokenId): string {
    //check if used in active
    //should I do a check now if gm mode still active?
    let activeTokens = tokensInActiveDuel.get("general")
    if (activeTokens) {
        if (activeTokens.includes(token_id)) {
            return token_id + " is in an active duel"
        } else if (activeTokens.includes(challenger_id)) {
            return challenger_id + " is in an active duel"
        }
    }
    let generalChallenges = openChallengesByType.get("general")
    if (generalChallenges) {
        let openChallenge = generalChallenges.challenges.get(token_id)
        if(openChallenge) {
            if (openChallenge.creator != context.predecessor) return "You aren't the originator: " + context.predecessor + ", " + openChallenge.creator
            let challenger = openChallenge.challengers.get(challenger_id)
            if (challenger) {
                let opponents: Opponent[] = []
                let creator = new Opponent(openChallenge.title, openChallenge.media, openChallenge.creator, openChallenge.thumbnail)
                creator.token_id = token_id
                let opponent = new Opponent(challenger.title,challenger.media,challenger.creator,challenger.thumbnail)
                opponent.token_id = challenger_id
                opponents.push(creator)
                opponents.push(opponent)
                initGM(opponents, 2)
                let profile = profiles.get(openChallenge.creator) 
                if (profile) {
                    profile.pendingChallenges.delete(token_id)
                    profiles.set(openChallenge.creator, profile)
                }
                generalChallenges.challenges.delete(token_id)
                openChallengesByType.set("general", generalChallenges)
                return "Success"
            } else {
                return "Challenger doesn't exist"
            }
        } else {
            return "Challenge doesn't exist"
        }
    } else {
        return "Invalid type"
    }
}
export function activate_gm(account_id: AccountId): void {
    let caller = context.predecessor
    if (account_id != caller) assert_owner()
    check_user_token_supply(account_id).then<StorageDeposit>(context.contractName,'_activate_gm',{account_id:account_id}, 20_000_000_000_000).returnAsResult()
}
export function _activate_gm(account_id: AccountId): Profile | null {
    let results = ContractPromise.getResults();
    if (results[0].succeeded) {
        let profile = profiles.get(account_id)
        if (profile) {
            profile.gmActive = true;
            profiles.set(account_id, profile)
            return profile
        }
    }
    return null
}
export function submit_ambassador_attempt(opponent: Opponent,id: AmbassadorId): void {
    assert(challenges.contains(id), "Challenge doesn't exist");
    assert(context.sender == opponent.account, "Can only submit your own attempts")
    assert(profiles.contains(opponent.account), "Profile doesn't exist")
    //VERIFY opponents data/thumbnail;
    let challenge = challenges.get(id)!;
    challenge.opponents.set(opponent.account, opponent)
    challenges.set(id, challenge);
}

function check_user_token_supply(account_id: AccountId): ContractPromise {
    let promise = ContractPromise.create<StorageDeposit>(            
        NFT_CONTRACT_ID,
        "nft_supply_for_owner",
        {account_id: account_id},
        10_000_000_000_000,
    )
    return promise
}
export function submit_open_challenge(token_id: string, account_id: AccountId | null = null): void {
    let caller:string;
    if (account_id) {
        assert_owner()
        caller = account_id
    } else {
        caller = context.sender
    }
    assert(profiles.contains(caller), "Profile doesn't exist")
    let profile = profiles.get(caller)!
    assert(profile.gmActive === true, "GM Mode not active")
    let generalActiveTokens = tokensInActiveDuel.get("general")
    if (generalActiveTokens) {
        assert(!generalActiveTokens.includes(token_id), "Already in active duel")
    } else {
        return
    }
    check_nft(token_id).then<OpenChallengeSubmission>(context.contractName, '_createOpenChallenge', {token_id: token_id, caller: caller}, 30_000_000_000_000).returnAsResult()
}
export function _createOpenChallenge(token_id: string, caller: string): OpenChallenge | null {
    let results = ContractPromise.getResults();
    if (results[0].succeeded) {
        let token = results[0].decode<NFTToken>()
        if (token.owner_id == caller) {
            let challenge = new OpenChallenge(caller, token_id, token.metadata.title, token.metadata.extra, token.metadata.media, context.blockTimestamp)
            let generalChallenges = openChallengesByType.get("general")
            if (generalChallenges) {
                generalChallenges.challenges.set(token_id, challenge)
                openChallengesByType.set("general", generalChallenges)
            } else {
                let generalChallenges = new OpenChallenges()
                generalChallenges.challenges.set(token_id, challenge)
                openChallengesByType.set("general", generalChallenges)
            }
            let profile = profiles.get(caller)!
            profile.pendingChallenges.set(token_id, 0)
            profiles.set(caller, profile)
            return challenge
        } else {
            return null
        }
    } else {
        return null
    }
}
function check_nft(token_id: string): ContractPromise {
    let promise =  ContractPromise.create<ID>(            
        NFT_CONTRACT_ID,
        "nft_token",
        {token_id: token_id},
        10_000_000_000_000,
    )
    return promise
}
export function get_account_pending_challenges(account_id: AccountId): Array<TokenId> {
    assert(profiles.contains(account_id), "Profile doesn't exixt")
    let profile = profiles.get(account_id)!
    return profile.pendingChallenges.keys()
}
export function get_open_challenges(amount: i32): OpenChallenge[] | null {
    if (amount < 1) amount = 1;
    if (amount > MAX_OPPONENTS) amount = MAX_OPPONENTS
    let generalChallenges = openChallengesByType.get("general")
    let challenges: OpenChallenge[] = []
    if (generalChallenges) {
        if (amount > generalChallenges.challenges.size) amount = generalChallenges.challenges.size
        let values =  generalChallenges.challenges.values()
        for (let i = 0; i < amount; i++) {
            let challenge = values[i]
            if (challenge) {
                challenges.push(challenge)
            }   
        }
        return challenges
    } else {
        return null
    }
    

}
export function remove_open_challenge(token_id: TokenId):void {
    assert(profiles.contains(context.sender), "Profile doesn't exist")
    let generalChallenges = openChallengesByType.get("general")
    if (generalChallenges) {
        let challenge = generalChallenges.challenges.get(token_id)
        assert(challenge.creator == context.sender, "You didn't create this challenge")
        let profile = profiles.get(challenge.creator)!
        if (profile.pendingChallenges.has(token_id)) {
            profile.pendingChallenges.delete(token_id)
        }
        generalChallenges.challenges.delete(token_id)
        openChallengesByType.set("general", generalChallenges)
        profiles.set(challenge.creator, profile)
    }
}
export function challenge_asset(id: string, target_id: string, initiator: AccountId | null = null): void {
    let caller: string | null = null;
    if (initiator !== null) {
        assert_owner()
        caller = initiator
    } else {
        caller = context.sender
    }
    assert(profiles.contains(caller), "Profile doesn't exist")
    let profile = profiles.get(caller)!
    assert(profile.gmActive === true, "GM Mode not active")
    if (caller) {
        check_nft(id).then<ChallengeSubmission>(context.contractName, '_createChallengeAttempt', {target_token_id: target_id, caller: caller}, 30_000_000_000_000).returnAsResult()
    }

    //return callbackPromise
}
export function _createChallengeAttempt(target_token_id: string, caller: string): OpenChallenge | null {
    let results = ContractPromise.getResults();
    if (results[0].succeeded) {
        let token = results[0].decode<NFTToken>()
        if (token.owner_id == caller) {
            let generalChallenges = openChallengesByType.get("general");
            if (generalChallenges){
                let openChallenge:OpenChallenge | null = generalChallenges.challenges.get(target_token_id)
                if (openChallenge) {
                    let challenger = new Challenger(token.owner_id, token.token_id, token.metadata.title, token.metadata.extra, token.metadata.media)
                    if (!openChallenge.challengers) {
                        openChallenge.challengers = new Map<TokenId, Challenger>()
                        openChallenge.challengers.set(token.token_id, challenger)
                    } else {
                        openChallenge.challengers.set(token.token_id, challenger)
                    }
                    generalChallenges.challenges.set(target_token_id, openChallenge)
                    openChallengesByType.set("general",generalChallenges)
                    let profile = profiles.get(openChallenge.creator)
                    if (profile) {
                        if (profile.pendingChallenges.has(target_token_id)) {
                            let pendingAmount = profile.pendingChallenges.get(target_token_id)
                            pendingAmount += 1
                            profile.pendingChallenges.set(target_token_id, pendingAmount)
                        } else {
                            profile.pendingChallenges.set(target_token_id, 1)
                        }
                        profiles.set(openChallenge.creator, profile)
                    }
                    //openChallenges.set(target_token_id, openChallenge)
                    return openChallenge
                } else {
                    return null
                }
            } else {
                return null
            }
        } else {
            return null
        }
    } else {
        return null
    }
}
export function remove_profile_alerts(account_id: AccountId): Profile | null{
    assert(account_id == context.predecessor, "You can only remove your own alerts")
    assert(profiles.contains(account_id), "Profile doesn't exist")
    let profile = profiles.get(account_id)
    if (profile) {
        profile.pendingChallenges = new Map<TokenId, u32>()
        profiles.set(account_id, profile)
        return profile
    }
    return null
}
export function get_challengers(token_id: TokenId): Map<string, Challenger> | null {
    let generalChallenges = openChallengesByType.get("general")
    if (generalChallenges) {
        if (generalChallenges.challenges.has(token_id)) {
            return generalChallenges.challenges.get(token_id).challengers
        }
    }
    return null
}
//challenge users asset
//check if sender owns nft asset
//check if profile exists for target
//create challenge submission
//send challenge to owner of targeted asset

//accept challenge (by id)
//check if sender has a challenge with that id
//create challenge


export function view_leaderboard(): DuelLeaderboard | null {
    if (!duelLeaderboardHistory.isEmpty) {
        return duelLeaderboardHistory.back
    }
    return null
}
/*export function test_sort(): LeaderboardEntry[] {
    let leaderboard = new DuelLeaderboard('test', 'none', 0, 0);
    let random = math.randomBuffer(10).reverse()
    for (let i=0; i < 10; i ++) {
        let entry = new LeaderboardEntry(random[i],'test')
        leaderboard.leaders.push(entry)
    }
    return leaderboard.leaders.sort((a, b) => i32(a.score - b.score))
}*/
export function add_owner(owner: AccountId): string {
    assert(context.predecessor == context.contractName, "Only the contract can call this function")
    owners.add(owner);
    if (owners.has(owner)) {
        return "Added"
    } else {
        return "Failed"
    }
   
}
export function end_duel(id:DuelId): string {
    assert_owner()
    const ended = duels.get(id)!.end();
    if (ended) {
        return "Duel ended"
    } else {
        return "No winner decided, duel still going"
    }
}
export function validate_submissions(submissions: Array<Opponent>): bool {
    assert(submissions.length < MAX_OPPONENTS, "Too many opponents")
    let accounts:Array<string> = []
    for(let i = 0; i < submissions.length; i++){
        let account = submissions[i].account
        assert(whitelist.has(account), "Account not on whitelist")
        assert(!accounts.includes(account), "Can't challenge yourself")
        accounts.push(account)
        //Account validation needs to beed upgraded
        //assert_account_is_valid(account, account)
        assert_thumbnail_is_valid(submissions[i].thumbnail)
        //assert_data_is_valid(submissions[i].data)
        assert_title_is_valid(submissions[i].title)
    }
    return true
}
export function vote_for(id:DuelId, receiver: AccountId): string {
    assert_contract_is_initialized()
    assert(context.sender == context.predecessor, "Users must vote directly")
    assert_on_whitelist()
    //assert(!voters.has(context.sender), "You have already voted.")
    assert(duels.contains(id), "Duel doesn't exist");
    return duels.get(id)!.vote_for(context.predecessor, receiver)
}
export function claim_winnings(id: DuelId): void {
    
    assert(context.sender == context.predecessor, "Users must claim directly")
    assert_on_whitelist()
   assert(duels.contains(id), "Duel doesn't exist");
   let claimer = context.sender
   assert(winnings.contains(claimer), "Account not on winner list")
   //Add check for gas amount
   let accountWinnings = winnings.getSome(claimer)
   let getWinnings = accountWinnings.get(id)
   if (getWinnings.claimed === false) {
       getWinnings.claimed = true
        getWinnings.claimed_at = context.blockTimestamp;
       accountWinnings.set(id, getWinnings)
       winnings.set(claimer, accountWinnings)
        processWinnings(id, claimer,getWinnings)!.returnAsResult()
   }
}
export function get_completed_duels_by_account(account: AccountId): Array<DuelData> | null{
    let profile = profiles.get(account)
    if (profile === null) {
        return null
    } else {
        let doneDuelIds = profile.completedDuels.values()
        let doneDuels: Array<DuelData> = []
        for (let i=0; i < doneDuelIds.length; i++) {
            //let opponents = get_duel_opponents(doneDuelIds[i])
            //assert(duels.contains(id), "Duel doesn't exist");
            let duel = duels.get(doneDuelIds[i])!
            if (duel) {
                let opponents = duel.opponents.values();
                const duelData = new DuelData(doneDuelIds[i],false,duel.winner.account,opponents,u64(duel.created_at + duel.roundLength));
                doneDuels.push(duelData)
            }
        }
        return doneDuels
    }
}
export function get_votes_received(account: AccountId): Array<VotesReceived> | null {
    let profile = profiles.get(account)
    if (profile === null) {
        return null
    } else {
        let doneDuelIds = profile.completedDuels.values()
        let doneDuels: Array<VotesReceived> = []
        for (let i=0; i < doneDuelIds.length; i++) {
            //let opponents = get_duel_opponents(doneDuelIds[i])
            //assert(duels.contains(id), "Duel doesn't exist");
            let duel = duels.get(doneDuelIds[i])!
            if (duel) {
                const earningsData = new VotesReceived(doneDuelIds[i],duel.opponents.get(account).voteScore, u64(duel.created_at + duel.roundLength));
                doneDuels.push(earningsData)
            }
        }
        return doneDuels;
    }
}
function processWinnings(duel_id: DuelId, receiver_id: AccountId, newWinnings: Winnings): ContractPromise | null {
    const gasLeft = context.prepaidGas - context.usedGas
    if (gasLeft < 20_000_000_000_000) {
        let claimer = context.sender
        let accountWinnings = winnings.getSome(claimer)
        newWinnings.claimed = false
        newWinnings.claimed_at = 0
        accountWinnings.set(duel_id, newWinnings)
        winnings.set(claimer, accountWinnings)
        return null
    }
    let promise = ContractPromise.create<FTTransferPayout>(            
        FT_CONTRACT_ID,
        "ft_transfer",
        {receiver_id:receiver_id, amount:newWinnings.amount},
        5_000_000_000_000,
        u128.from(1)
        )
    let callbackPromise = promise.then<ClaimId>(context.contractName, "_setToClaimed", {id:duel_id, sender: receiver_id, claimWinnings: newWinnings}, 15_000_000_000_000, u128.from(0))
    return callbackPromise

}

export function _setToClaimed(id: DuelId, sender: AccountId, claimWinnings: Winnings): Winnings | null {
    let results = ContractPromise.getResults();
    if (results[0].succeeded) {
        return claimWinnings;
    } else {
        if (claimWinnings.claimed === true) {
            let accountWinnings = winnings.getSome(sender)
            claimWinnings.claimed = false;
            claimWinnings.claimed_at = 0;
            accountWinnings.set(id, claimWinnings)
            winnings.set(sender, accountWinnings)
        }
        return null
    }
    
}
export function check_winnings(account:AccountId): Map<string, Winnings> | null{
    let getAccountWinnings = winnings.get(account)
    return getAccountWinnings
}
export function get_vote_score(id:DuelId): i32 {
    assert_contract_is_initialized()
    assert(duels.contains(id), "Duel doesn't exist");
    return duels.get(id)!.get_total_votes()
}
export function get_vote_score_for(id:DuelId, receiver: AccountId): i32 {
    assert_contract_is_initialized()
    assert(duels.contains(id), "Duel doesn't exist");
    assert(opIDs.has(receiver), "Opponent doesn't exist.")
    let duel = duels.get(id)!
    return duel.get_vote_count_for(receiver)
}
export function check_if_active(id:DuelId): bool {
    assert(duels.contains(id), "Duel doesn't exist");
    return duels.get(id)!.active
}
export function unfollow_account(account: AccountId): string {
    let caller = context.predecessor
    assert_on_whitelist()
    assert(profiles.contains(caller), "Your profile doesn't exist")
    if (profiles.contains(account)) {
        let profile = profiles.getSome(account);
        let index  = profile.followers.indexOf(caller)
        if (index >= 0) {
            profile.followers.splice(index, 1)
            profiles.set(account, profile);
            let unFollower = profiles.getSome(caller);
            let index_two = unFollower.following.indexOf(account)
            if (index_two >= 0) {
                unFollower.following.splice(index_two,1)
                profiles.set(caller, unFollower);
                return "Success"
            } else {
                return "Success"
            }
        } else {
            let unFollower = profiles.getSome(caller);
            let index_two = unFollower.following.indexOf(account)
            if (index_two >= 0) {
                unFollower.following.splice(index_two,1)
                profiles.set(caller, unFollower);
            }
            return "Success"
        }
    } else {
        return "Profile doesn't exist"
    }
}
export function follow_account(account: AccountId): string {
    let caller = context.predecessor
    assert_on_whitelist()
    assert(profiles.contains(caller), "Your profile doesn't exist")
    if (profiles.contains(account)) {
        let profile = profiles.getSome(account);
        if (profile.followers.includes(caller)) {
            return "Already following"
        }
        profile.followers.push(caller);
        profiles.set(account, profile);
        let follower = profiles.getSome(caller);
        follower.following.push(account);
        profiles.set(caller, follower);
        return "Followed"
    } else {
        return "Profile doesn't exist"
    }
    
}
export function get_followers(account: AccountId): string[] | null {
    if (profiles.contains(account)) {
        let followers = profiles.getSome(account).followers
        return followers
    } else {
        return null
    }
   
}
export function get_winner(id: DuelId): Opponent | null {
    assert(duels.contains(id), "Duel doesn't exist")  
    let winner = duels.get(id)!.winner
    return winner
}
export function get_result(id: DuelId): Opponent | null {
    assert(duels.contains(id), "Duel doesn't exist")
    if (duels.contains(id)) {
        let duel = duels.get(id)!
        let winner = duel.winner
        if (winner == null) {
            if (!duel.shouldBeActive()) {
                return duel.winner
            }
        }
        return winner
    } else {
        return null
    }
}
export function get_opponents(id:DuelId): Array<Opponent> {
    assert_contract_is_initialized()
    assert(duels.contains(id), "Duel doesn't exist");
    const ops = new Array<Opponent>();
    let opponents = duels.get(id)!.opponents
    for (let i = 0; i < opIDs.size; i++) {
        let opponent = opponents.get(opIDs.values()[i])
        ops.push(opponent)
    }
    return ops
}
export function get_opponent(id:DuelId,opponent: AccountId): Opponent {
    assert(duels.contains(id), "Duel doesn't exist");
    const duel = duels.get(id)!
    assert(opIDs.has(opponent), "Opponent doesn't exist")
    return duels.get(id)!.opponents.get(opponent)
}
export function get_duel(id:DuelId): Duel {
    assert(duelIds.has(id), "Duel doesn't exist");
    return duels.get(id)!
}
export function get_ambassador_challenge(id:AmbassadorId): AmbassadorChallenge | null {
    assert(challengeIds.has(id), "Duel doesn't exist");
    return challenges.get(id)
}
export function get_ambassador_challenge_ids(): string[] {
    return challengeIds.values()
}
export function get_pool_distribution(id:DuelId): Map<string, number> {
    assert(duelIds.has(id), "Duel doesn't exist");
    return duels.get(id)!.poolDistribution;
}
export function remove_duels_by_amount(amount: i32):void {
    const max_duel_deletes = 5;
    assert_owner()
    assert(amount <= max_duel_deletes, "Trying to delete too many")
    let ids = duelIds.values()
    if (amount > ids.length) {
        amount = ids.length
    }
    for(let i=0; i < amount; i++) {
        duels.delete(ids[i])
        duelIds.delete(ids[i])
    }
}
export function get_duel_opponents(id: string, onlyActive: boolean = false): DuelData | null {
    assert(duels.contains(id), "Duel doesn't exist");
    let duel = duels.get(id)!
    let opponents = duel.opponents.values();
    if (duel.active === true) {
        const duelData = new DuelData(id,duel.active,"",opponents);
        return duelData
    } else {
        if (onlyActive === true) {
            return null
        }
        if (duel.winner) {
            const duelData = new DuelData(id,false,duel.winner.account,opponents,u64(duel.created_at + duel.roundLength));
            return duelData
        } else  {
            const duelData = new DuelData(id,false,"",opponents);
            return duelData         
        }
    }
}

export function get_duelids_by_account(account:AccountId): Set<string> | null {
    let ids = duelIdsMap.get(account)
    return ids
}
export function get_active_duels_of_follows(account: AccountId): Array<DuelData> | null {
    let profile = profiles.get(account)
    let returnActiveDuels: Array<DuelData> = []
    if (profile) {
        //let following = profile.following
        for (let i=0;i<profile.following.length;i++) {
            let followProfile = profiles.get(profile.following[i])
            if (followProfile) {
                let followActiveDuels = followProfile.activeDuels.values()
                for (let j=0;j<followActiveDuels.length;j++) {
                    let duel = duels.get(followActiveDuels[j])!
                    let opponents = duel.opponents.values();
                    const duelData = new DuelData(duel.id,duel.active,"",opponents);
                    returnActiveDuels.push(duelData)
                }
            }
        }
    }
    return returnActiveDuels
}
export function get_active_duels_by_account(account: AccountId, range: Array<i32> = [0,10]): Array<DuelData> | null{
    assert(range[0] >= 0, "Can't request negatives");
    assert(range[0] < range[1], "First number is higher than second");
    assert((range[1] - range[0]) <= MAX_DUEL_REQUESTS, "Requested too many duels");
   
    let profile = profiles.get(account)
    let activeDuels: Array<DuelData> = []
    if (profile) {
        let duelIds = profile.activeDuels.values()
        if (range[1] > duelIds.length) {
            range[1] = duelIds.length
        }
        for (let i = range[0]; i < range[1]; i++) {
            let duel = get_duel_opponents(duelIds[i])
            if (duel) {
                activeDuels.push(duel)
            }
        }
        return activeDuels
    }
    return null
}
export function get_active_duels(range: Array<i32>): Array<DuelData>{
    assert(range[0] >= 0, "Can't request negatives");
    assert(range[0] < range[1], "First number is higher than second");
    assert((range[1] - range[0]) <= MAX_DUEL_REQUESTS, "Requested too many duels");
    
    let manyDuelData: Array<DuelData> = new Array<DuelData>();
    let ids = activeDuels.values()
    if (range[1] > ids.length) {
        range[1] = ids.length
    }
    for (let i = range[0]; i < range[1]; i++) {
        let duel = get_duel_opponents(ids[i], true);
        if (duel)  manyDuelData.push(duel);
    }
    return manyDuelData
}
export function get_many_duel_opponents_by_id(ids: Array<string>):Array<DuelData> {
    assert(ids.length <= MAX_DUEL_REQUESTS, "Requested too many duels");
    let duels: Array<DuelData> = []
    for(let i=0; i < ids.length; i++) {
        let duel = get_duel_opponents(ids[i])
        if (duel) {
            duels.push(duel)
        }
    }
    return duels
}
export function get_many_duel_opponents(range: Array<i32>, onlyActive: boolean = true):Array<DuelData> {
    assert(range[0] >= 0, "Can't request negatives");
    assert(range[0] < range[1], "First number is higher than second");
    assert((range[1] - range[0]) <= MAX_DUEL_REQUESTS, "Requested too many duels");
    let ids = duelIds.values();
    if(range[1] > ids.length) range[1] = ids.length;
    assert(range[1] <= ids.length, "Request more duels than exist");
    let manyDuelData: Array<DuelData> = new Array<DuelData>();
    for(let i=range[0]; i < range[1]; i++) {
        if (duels.contains(ids[i])) {
            let duel = duels.get(ids[i])!
            if (onlyActive) {
                if (duel.active) {
                    let opponents = duel.opponents.values();
                    manyDuelData.push(new DuelData(ids[i], duel.active,"",opponents))
                }
            } else {
                let opponents = duel.opponents.values();
                manyDuelData.push(new DuelData(ids[i], duel.active,"",opponents))
            }

        }
    }
    return manyDuelData
}
export function create_profile(name: string = ""): Profile {
    assert_on_whitelist()
    const caller = context.predecessor
    if (name === "") {
        name = caller
    } else {
        assert_owner()
    }
    let exists = profileIds.has(name)
    //assert(exists === false, `Profile id: ${name} exists already`)
    assert(!profiles.contains(name), "Profile already exists")
    
    let profile = new Profile(name, name)
    profiles.set(name, profile)
    profileIds.add(name)
    return profile
}
export function delete_profile(account: AccountId): bool[] {
    assert_owner()
    profiles.delete(account)
    profileIds.delete(account)
    return [profiles.contains(account),profileIds.has(account)]
    
}
export function get_profiles(): string[] {
    return profileIds.values()
}
export function edit_name(name: string): string | null {
    const caller = context.predecessor
    assert(name.length < PROFILE_NAME_MAX_LENGTH, "Name too long")
    //ADD checks for banned words?
    if (profileIds.has(caller) && profiles.contains(caller)) {
        let profile = profiles.get(caller)!;
        profile.name = name
        profiles.set(caller, profile)
        return "Edited"
    } else {
        return null
    } 
}
export function edit_tagline(tagline: string): string | null{
    const caller = context.predecessor
    assert(tagline.length < PROFILE_TAGLINE_MAX_LENGTH, "Tagline too long")
    if (profileIds.has(caller) && profiles.contains(caller)) {
        let profile = profiles.get(caller)!;
        profile.tagline = tagline
        profiles.set(caller, profile)
        return "Edited"
    } else {
        return null
    }
}
export function get_nationalities(): string[] {
    return nationalities.values()
} 
export function add_nationalities(newNationalities: Array<string>): string[] {
    assert_owner()
    for (let i = 0; i < newNationalities.length;i++) {
        assert(newNationalities[i].length > 0 && newNationalities[i].length < 3, "Not compatible")
        nationalities.add(newNationalities[i])
    }
    return nationalities.values()
}
export function edit_nationality(nationality: string): string | null{
    const caller = context.predecessor
    assert(nationalities.has(nationality), "Not on list")
    if (profileIds.has(caller) && profiles.contains(caller)) {
        let profile = profiles.get(caller)!;
        profile.nationality = nationality
        profiles.set(caller, profile)
        return "Edited"
    } else {
        return null
    }
}
export function get_profile(account: AccountId): Profile | null {
    if (profileIds.has(account) && profiles.contains(account)) {
        return profiles.get(account)!
    } else {
        return null
    }
}

export function get_duels_by_account(account: AccountId, onlyActive:boolean = false, range: Array<i32> = [0,10]): Array<DuelData> {
    assert(range[0] >= 0, "Can't request negatives");
    assert(range[0] < range[1], "First number is higher than second");
    assert((range[1] - range[0]) <= MAX_DUEL_REQUESTS, "Requested too many duels");
    let duelArray: Array<DuelData> = []
    if (duelIdsMap.contains(account)) {
       let ids = duelIdsMap.get(account)
       if (ids) {
           let idsArray = ids.values()
           if (range[1] > idsArray.length) {
                range[1] = idsArray.length
            }
           for (let i=range[0]; i < range[1]; i++) {
               let duel = get_duel_opponents(idsArray[i], onlyActive)
               if (duel) {
                duelArray.push(duel)
               }         
           }
       } else {
           throw "Why account in map but no ids?"
       }
    }
    return duelArray
}
export function get_all_duels(): Map<DuelId, Duel> {
    const allDuels: Map<DuelId, Duel> = new Map<DuelId, Duel>();
    let results:i32;
    let ids = duelIds.values()
    if(ids.length < 10) {
        results = ids.length
    } else {
       results = 10
    }
    for(let i=0; i < results; i++) {
        allDuels.set(ids[i], duels.getSome(ids[i]))
    }
    return allDuels
}
export function make_mintable(id: DuelId, account_id: AccountId): Profile {
    assert_owner()
    assert(profiles.contains(account_id), "Profile doesn't exist")
    let profile = profiles.get(account_id)!
    assert(duelIds.has(id), "Duel doesn't exist")
    assert(!profile.mintedAssets.has(account_id+":"+id), "Already minted")
    profile.mintableAssets.push(id)
    profiles.set(account_id, profile)
    return profile
}
export function mint_asset(id: DuelId, account: AccountId | null = null): void {
    //get profile
    //check if profile.mintableAssets contains DuelID
    //get duel -> opponents -> caller -> asset
    //create token_id
    //remove duelId from mintableAssets, add token_id to mintedAssets
    //set profile 
    //cross-contract call minting asset - make sure nft contract checks predecessor
    //if success return token_id
    //if fail remove from mintedAssets, add to mintableAssets
    var caller: string;
    if (!account) {
        caller = context.sender
    } else {
        assert_owner()
        caller = account!
    }

    assert(profiles.contains(caller), "Profile doesn't exist")
    assert(duelIds.has(id), "ID doesn't exist")
    let profile = profiles.get(caller)!
    //let assetIndex = profile.mintableAssets.indexOf(id)
    assert(profile.readyToMint.has(id), "Asset not ready to mint")
    let asset = profile.readyToMint.get(id)
    //assert(assetIndex >= 0, "Asset not mintable")
    let duel = duels.get(id)!
    assert(duel.opponents.has(caller), "You didn't participate in this duel")
    let opponent = duel.opponents.get(caller)!
    let token_id = caller + ":" + id
    assert(!profile.mintedAssets.has(token_id), "Asset already minted")
    //profile.mintableAssets.splice(assetIndex, 1)
    profile.readyToMint.delete(id)
    profile.mintedAssets.add(token_id)
    profiles.set(caller, profile)
    let royalties = new Map<AccountId, u32>()
    royalties.set(caller, 2000)
    let promise = ContractPromise.create<MintNFT>(            
        NFT_CONTRACT_ID,
        "nft_mint",
        {token_id: token_id, metadata: {title:opponent.title, description: "test", extra: opponent.thumbnail, media: "https://"+asset.cid+"."+asset.provider+"/"+asset.filename }, receiver_id: caller, perpetual_royalties: royalties},
        30_000_000_000_000,
        context.attachedDeposit, //DOUBLE CHECK
    )
    promise.then<MintResponse>(context.contractName, "_mintResponse", {id: id, token_id: token_id, account_id: caller, data: asset}, 10_000_000_000_000).returnAsResult()
}
export function _mintResponse(id: DuelId, token_id: TokenId, account_id: AccountId, data: UploadedNFT): string{
    let results = ContractPromise.getResults()
   
    if (results[0].succeeded) {
        return token_id
    } else {
        let profile = profiles.get(account_id)
        if (profile) {
            //profile.mintableAssets.push(id)
            profile.readyToMint.set(id, data)
            profile.mintedAssets.delete(token_id)
            profiles.set(account_id, profile)
        }
        return "Failed"
    }  
}
export function clear_mintable(account: AccountId): Profile | null {
    assert_owner()
    let profile = profiles.get(account)
    if (profile) {
        profile.mintableAssets = []
        profiles.set(account, profile)
        return profile
    }
    return null
}
export function clear_minted(account: AccountId): Profile | null {
    assert_owner()
    let profile = profiles.get(account)
    if (profile) {
        profile.mintedAssets.clear()
        profiles.set(account, profile)
        return profile
    }
    return null
}
export function set_nft_to_ready(id: DuelId, data: UploadedNFT,  account: AccountId): Profile {
    assert_owner()
    //check if id in mintedassets
    let profile = profiles.get(account)!
    let mintableIndex = profile.mintableAssets.indexOf(id)
    assert(mintableIndex >= 0, "Not mintable")
    assert(!profile.mintedAssets.has(id), "Already minted")
    assert(!profile.readyToMint.has(id))
    //ADD checks to verify url
    profile.readyToMint.set(id, data);
    profile.mintableAssets.splice(mintableIndex, 1);
    profiles.set(account, profile);
    return profile
}
export function check_if_mintable(account: AccountId, id: DuelId): bool {
    let profile = profiles.get(account)!
    return profile.mintableAssets.includes(id)
}
export function get_opponent_data(account: AccountId, id: DuelId): string {
    assert(profiles.contains(account), "Profile doesn't exist")
    assert(duels.contains(id), "Duel doesn't exist")
    let opponents = duels.get(id)!.opponents
    assert(opponents.has(account), "Account didn't participate in that duel")
    return opponents.get(account).data
}

//near call $TEST_NFT_CONTRACT_ID nft_mint '{"token_id": "events-token", "metadata": {"title": "Events Token", "description": "testing out the new events extension of the standard", "media": "https://bafybeiddtdfhlyziaz57mxqjbsxeffqxat3onkfeagwrylc4x6coibxlpq.ipfs.nftstorage.link/recording1652544611642.mp4"}, "receiver_id": "allskills.testnet", "perpetual_royalties": {"allskills.testnet": 2000}}' --accountId $TEST_NFT_CONTRACT_ID --amount 0.1
export function add_to_whitelist(account:AccountId): string | null {
    assert_owner()
    if(whitelist.has(account)) {
        return "Account already on whitelist"
    }
    whitelist.add(account)
    return whitelist.has(account).toString()
}
export function remove_from_whitelist(account:AccountId): string | null {
    assert_owner()
    if(whitelist.has(account)) {
        whitelist.delete(account)
        return whitelist.has(account).toString()
    } else {
        return "Account not on whitelist"
    }
    
}
function assert_on_whitelist():void {
    const caller = context.predecessor
    assert(whitelist.has(caller), "Only whitelisted accounts can call this function")
}
function assert_owner(): void {
    const caller = context.predecessor
    assert(owners.has(caller), "Only the owners of this contract may call this function")
}
function assert_thumbnail_is_valid(data: string): void {
    assert(data.includes("allskills-user-images"), "Thumbnail is invalid.")
}
function assert_data_is_valid(data: string): void {
    assert(data.includes("livepeer"), "Link data is invalid.")
}
function assert_title_is_valid(title: string): void {
    assert(title.length > 0, "Missing a title.")
    assert(title.length < 100, "Title is too long.")
}

function assert_account_is_valid(account: string, sub: string): void {
    assert(account == sub, "Account info doesn't match.")
}

function is_initialized(): bool {
    return storage.hasKey("state");
}

function assert_contract_is_initialized(): void {
    assert(is_initialized(), "Contract must be initialized first.");
}
function generateRandomDNA(): string {
    let buf = math.randomBuffer(8);
    let b64 = base64.encode(buf);
    return b64
}