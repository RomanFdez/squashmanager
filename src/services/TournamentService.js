import { supabase } from '../lib/supabaseClient';

const CLUB_ID = 'cdsciudadmurcia';

// ============================================================
// TOURNAMENTS CRUD
// ============================================================

export const getTournaments = async () => {
    const { data, error } = await supabase
        .from('tournaments')
        .select(`
      *,
      tournament_categories (
        id, name, type, age_group,
        tournament_registrations (id)
      )
    `)
        .eq('club_id', CLUB_ID)
        .order('start_date', { ascending: false });

    if (error) throw error;
    return data;
};

export const getTournamentById = async (id) => {
    const { data, error } = await supabase
        .from('tournaments')
        .select(`
      *,
      tournament_courts (*),
      tournament_categories (
        *,
        tournament_registrations (
          *,
          member:members (id, name, email, phone),
          external_player:external_players (id, name, email, phone)
        )
      ),
      tournament_images (
        *,
        club_image:club_images (*)
      )
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const getTournamentBySlug = async (slug) => {
    const { data, error } = await supabase
        .from('tournaments')
        .select(`
      *,
      tournament_courts (*),
      tournament_images (
        *,
        club_image:club_images (*)
      ),
      tournament_categories (
        *,
        tournament_registrations (*),
        tournament_brackets (
          *,
          tournament_matches (*)
        )
      )
    `)
        .eq('public_slug', slug)
        .single();

    if (error) throw error;
    return data;
};

export const createTournament = async (tournamentData) => {
    const { data, error } = await supabase
        .from('tournaments')
        .insert({
            ...tournamentData,
            club_id: CLUB_ID,
            public_slug: generateSlug(tournamentData.name)
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateTournament = async (id, updates) => {
    const { data, error } = await supabase
        .from('tournaments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteTournament = async (id) => {
    const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

    if (error) throw error;
};

// ============================================================
// COURTS
// ============================================================

export const getCourts = async (tournamentId) => {
    const { data, error } = await supabase
        .from('tournament_courts')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('order_num');

    if (error) throw error;
    return data;
};

export const addCourt = async (tournamentId, name) => {
    const { data, error } = await supabase
        .from('tournament_courts')
        .insert({ tournament_id: tournamentId, name })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteCourt = async (courtId) => {
    const { error } = await supabase
        .from('tournament_courts')
        .delete()
        .eq('id', courtId);

    if (error) throw error;
};

// ============================================================
// CATEGORIES
// ============================================================

export const getCategories = async (tournamentId) => {
    const { data, error } = await supabase
        .from('tournament_categories')
        .select(`
            *,
            tournament_registrations(
        *,
                member: members(id, name, email),
                external_player: external_players(id, name, email)
            )
                `)
        .eq('tournament_id', tournamentId)
        .order('order_num');

    if (error) throw error;
    return data;
};

export const createCategory = async (tournamentId, categoryData) => {
    const { data, error } = await supabase
        .from('tournament_categories')
        .insert({ tournament_id: tournamentId, ...categoryData })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateCategory = async (categoryId, updates) => {
    const { data, error } = await supabase
        .from('tournament_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteCategory = async (categoryId) => {
    const { error } = await supabase
        .from('tournament_categories')
        .delete()
        .eq('id', categoryId);

    if (error) throw error;
};

// ============================================================
// REGISTRATIONS (Players)
// ============================================================

export const getRegistrations = async (categoryId) => {
    const { data, error } = await supabase
        .from('tournament_registrations')
        .select(`
            *,
            member: members(id, name, email, phone),
            external_player: external_players(id, name, email, phone)
            `)
        .eq('category_id', categoryId)
        .order('seed', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return data;
};

export const registerMember = async (categoryId, memberId, registrationData) => {
    const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
            category_id: categoryId,
            member_id: memberId,
            is_self_registered: true,
            ...registrationData
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const registerExternalPlayer = async (categoryId, playerData) => {
    // First create the external player
    const { data: player, error: playerError } = await supabase
        .from('external_players')
        .insert({
            club_id: CLUB_ID,
            name: playerData.name,
            email: playerData.email,
            phone: playerData.phone
        })
        .select()
        .single();

    if (playerError) throw playerError;

    // Then register them
    const { data, error } = await supabase
        .from('tournament_registrations')
        .insert({
            category_id: categoryId,
            external_player_id: player.id,
            registration_name: playerData.name,
            registration_email: playerData.email,
            registration_phone: playerData.phone,
            is_self_registered: true
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const removeRegistration = async (registrationId) => {
    const { error } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('id', registrationId);

    if (error) throw error;
};

export const updateRegistration = async (registrationId, updates) => {
    const { data, error } = await supabase
        .from('tournament_registrations')
        .update(updates)
        .eq('id', registrationId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ============================================================
// CLUB IMAGES (Shared across tournaments)
// ============================================================

export const getClubImages = async () => {
    const { data, error } = await supabase
        .from('club_images')
        .select('*')
        .eq('club_id', CLUB_ID)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const uploadClubImage = async (file, type = 'general') => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${CLUB_ID} / ${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from('tournament-images')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('tournament-images')
        .getPublicUrl(filePath);

    // Save to club_images table
    const { data, error } = await supabase
        .from('club_images')
        .insert({
            club_id: CLUB_ID,
            image_url: urlData.publicUrl,
            name: file.name,
            type
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteClubImage = async (imageId, imageUrl) => {
    // Extract file path from URL
    const urlParts = imageUrl.split('/tournament-images/');
    if (urlParts.length > 1) {
        await supabase.storage
            .from('tournament-images')
            .remove([urlParts[1]]);
    }

    const { error } = await supabase
        .from('club_images')
        .delete()
        .eq('id', imageId);

    if (error) throw error;
};

// ============================================================
// TOURNAMENT IMAGES (Assignment)
// ============================================================

export const getTournamentImages = async (tournamentId) => {
    const { data, error } = await supabase
        .from('tournament_images')
        .select(`
        *,
            club_image: club_images(*)
                `)
        .eq('tournament_id', tournamentId)
        .order('slot_number');

    if (error) throw error;
    return data;
};

export const assignImageToTournament = async (tournamentId, clubImageId, slotNumber) => {
    // Upsert: if slot exists, update; otherwise insert
    const { data, error } = await supabase
        .from('tournament_images')
        .upsert({
            tournament_id: tournamentId,
            club_image_id: clubImageId,
            slot_number: slotNumber
        }, {
            onConflict: 'tournament_id,slot_number'
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const removeImageFromTournament = async (tournamentId, slotNumber) => {
    const { error } = await supabase
        .from('tournament_images')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('slot_number', slotNumber);

    if (error) throw error;
};

// ============================================================
// BRACKETS
// ============================================================

export const getBrackets = async (categoryId) => {
    const { data, error } = await supabase
        .from('tournament_brackets')
        .select(`
        *,
            tournament_matches(
        *,
                player1: tournament_registrations!tournament_matches_player1_id_fkey(
                    *,
                    member: members(id, name),
                    external_player: external_players(id, name)
                ),
                player2: tournament_registrations!tournament_matches_player2_id_fkey(
                    *,
                    member: members(id, name),
                    external_player: external_players(id, name)
                ),
                winner: tournament_registrations!tournament_matches_winner_id_fkey(
                    *,
                    member: members(id, name),
                    external_player: external_players(id, name)
                ),
                court: tournament_courts(id, name)
            )
                `)
        .eq('category_id', categoryId)
        .order('consolation_level');

    if (error) throw error;
    return data;
};

export const getGroups = async (categoryId) => {
    const { data, error } = await supabase
        .from('tournament_groups')
        .select(`
            *,
            tournament_group_players(
                *,
                registration: tournament_registrations(
                    *,
                    member: members(name),
                    external_player: external_players(name)
                )
            ),
            tournament_group_matches(*)
                `)
        .eq('category_id', categoryId)
        .order('order_num');

    if (error) throw error;
    return data;
};

export const createBracket = async (categoryId, bracketType, name, consolationLevel = 0) => {
    const { data, error } = await supabase
        .from('tournament_brackets')
        .insert({
            category_id: categoryId,
            bracket_type: bracketType,
            name,
            consolation_level: consolationLevel
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

// ============================================================
// MATCHES
// ============================================================

export const createMatch = async (matchData) => {
    const { data, error } = await supabase
        .from('tournament_matches')
        .insert(matchData)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateMatch = async (matchId, updates) => {
    const { data, error } = await supabase
        .from('tournament_matches')
        .update(updates)
        .eq('id', matchId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getMatchById = async (matchId) => {
    const { data, error } = await supabase
        .from('tournament_matches')
        .select(`
            *,
            player1: tournament_registrations!tournament_matches_player1_id_fkey(
                id, registration_name,
                member: members(id, name),
                external_player: external_players(id, name)
            ),
            player2: tournament_registrations!tournament_matches_player2_id_fkey(
                id, registration_name,
                member: members(id, name),
                external_player: external_players(id, name)
            )
            `)
        .eq('id', matchId)
        .single();

    if (error) throw error;
    return data;
};

export const updateGroupMatch = async (matchId, updates) => {
    const { data, error } = await supabase
        .from('tournament_group_matches')
        .update(updates)
        .eq('id', matchId)
        .select()
        .single();

    if (error) throw error;

    // Trigger stats recalculation
    if (data.group_id) {
        await recalculateGroupStats(data.group_id);
    }

    return data;
};

const recalculateGroupStats = async (groupId) => {
    // 1. Get all matches for the group
    const { data: matches, error: mError } = await supabase
        .from('tournament_group_matches')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'completed');

    if (mError) throw mError;

    // 2. Get all players for the group
    const { data: players, error: pError } = await supabase
        .from('tournament_group_players')
        .select('*')
        .eq('group_id', groupId);

    if (pError) throw pError;

    const stats = {};
    players.forEach(p => {
        stats[p.registration_id] = {
            points: 0,
            games_won: 0, // Treats as Matches Won
            games_lost: 0, // Treats as Matches Lost
            sets_won: 0,
            sets_lost: 0
        };
    });

    matches.forEach(m => {
        if (!m.winner_id) return;

        // Winner Stats (1 point per win)
        if (stats[m.winner_id]) {
            stats[m.winner_id].points += 1;
            stats[m.winner_id].games_won += 1;
        }

        // Loser Stats
        const loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
        if (stats[loserId]) {
            stats[loserId].games_lost += 1;
        }

        // Sets Stats
        if (m.score && Array.isArray(m.score)) {
            let p1Sets = 0;
            let p2Sets = 0;
            m.score.forEach(s => {
                const s1 = parseInt(s.p1 || 0);
                const s2 = parseInt(s.p2 || 0);
                if (s1 > s2) p1Sets++;
                else if (s2 > s1) p2Sets++;
            });

            if (stats[m.player1_id]) {
                stats[m.player1_id].sets_won += p1Sets;
                stats[m.player1_id].sets_lost += p2Sets;
            }
            if (stats[m.player2_id]) {
                stats[m.player2_id].sets_won += p2Sets;
                stats[m.player2_id].sets_lost += p1Sets;
            }
        }
    });

    // Update DB
    for (const [regId, stat] of Object.entries(stats)) {
        await supabase
            .from('tournament_group_players')
            .update(stat)
            .eq('group_id', groupId)
            .eq('registration_id', regId);
    }
};
// DRAW GENERATION
// ============================================================

/**
 * Generates the bracket structure for a category
 * @param {string} categoryId 
 * @param {Array} registrations - Array of player registrations
 */
/**
 * Main Entry Point for generating draws
 * Dispatches to Monrad or Group Phase generation based on config
 */
export const generateDraw = async (categoryId, registrations, config = {}) => {
    const format = config.format || 'monrad';
    const playersPerGroup = config.playersPerGroup || 4;
    const advanceToMain = config.advanceToMain || 2;

    // 1. Update Category Configuration
    const { error: updateError } = await supabase
        .from('tournament_categories')
        .update({
            has_group_phase: format === 'groups',
            players_per_group: playersPerGroup,
            advance_to_main: advanceToMain
        })
        .eq('id', categoryId);

    if (updateError) throw updateError;

    // 2. Clear existing draws (Brackets AND Groups)
    await clearCategoryDraws(categoryId);

    // 3. Generate based on format
    if (format === 'groups') {
        return generateGroupPhase(categoryId, registrations, playersPerGroup);
    } else {
        return generateMonradDraw(categoryId, registrations);
    }
};

/**
 * Clears all brackets, matches, and groups for a category
 */
const clearCategoryDraws = async (categoryId) => {
    // Delete Brackets (Cascades to Matches)
    const { error: bError } = await supabase
        .from('tournament_brackets')
        .delete()
        .eq('category_id', categoryId);
    if (bError) throw bError;

    // Delete Groups (Cascades to Group Matches and Players)
    const { error: gError } = await supabase
        .from('tournament_groups')
        .delete()
        .eq('category_id', categoryId);
    if (gError) throw gError;
};

/**
 * Generates Round Robin Group Phase
 */
const generateGroupPhase = async (categoryId, registrations, maxPerGroup) => {
    const numPlayers = registrations.length;
    if (numPlayers < 3) throw new Error('Se necesitan al menos 3 jugadores para una fase de grupos');

    // Shuffle players
    const shuffledPlayers = [...registrations].sort(() => Math.random() - 0.5);

    // Calculate Groups
    // We want balanced groups.
    // Example: 10 players, max 4.
    // Groups needed: Ceil(10/4) = 3.
    // Distribution: 10/3 = 3.33 -> Two groups of 3+1=4, one group of 3.
    // 4, 3, 3 -> Total 10. Correct.
    const numGroups = Math.ceil(numPlayers / maxPerGroup);
    const baseSize = Math.floor(numPlayers / numGroups);
    const remainder = numPlayers % numGroups;

    // Create Group Records
    const groupsToInsert = [];
    for (let i = 0; i < numGroups; i++) {
        groupsToInsert.push({
            category_id: categoryId,
            name: `Grupo ${String.fromCharCode(65 + i)}`, // A, B, C...
            order_num: i + 1
        });
    }

    const { data: createdGroups, error: gError } = await supabase
        .from('tournament_groups')
        .insert(groupsToInsert)
        .select();
    if (gError) throw gError;

    // Ensure groups are sorted by order
    createdGroups.sort((a, b) => a.order_num - b.order_num);

    const groupPlayers = [];
    const groupMatches = [];
    let playerIdx = 0;

    for (let i = 0; i < numGroups; i++) {
        const group = createdGroups[i];
        // Groups 0 to remainder-1 get baseSize + 1 players
        const size = baseSize + (i < remainder ? 1 : 0);
        const groupPlayerList = [];

        for (let j = 0; j < size; j++) {
            if (playerIdx < numPlayers) {
                const player = shuffledPlayers[playerIdx++];
                groupPlayers.push({
                    group_id: group.id,
                    registration_id: player.id,
                    position: 0,
                    points: 0
                });
                groupPlayerList.push(player);
            }
        }

        // Generate All-vs-All Matches
        for (let x = 0; x < groupPlayerList.length; x++) {
            for (let y = x + 1; y < groupPlayerList.length; y++) {
                groupMatches.push({
                    group_id: group.id,
                    player1_id: groupPlayerList[x].id,
                    player2_id: groupPlayerList[y].id,
                    status: 'pending'
                });
            }
        }
    }

    // Insert Players
    if (groupPlayers.length > 0) {
        const { error: pError } = await supabase.from('tournament_group_players').insert(groupPlayers);
        if (pError) throw pError;
    }

    // Insert Matches
    if (groupMatches.length > 0) {
        const { error: mError } = await supabase.from('tournament_group_matches').insert(groupMatches);
        if (mError) throw mError;
    }
};

/**
 * Generates Standard Elimination (Monrad) Bracket
 */
const generateMonradDraw = async (categoryId, registrations) => {
    const numPlayers = registrations.length;
    if (numPlayers < 2) {
        throw new Error('Se necesitan al menos 2 jugadores para generar un cuadro');
    }

    // Calculate bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
    const numMatchesFirstRound = bracketSize / 2;
    const numByes = bracketSize - numPlayers;

    console.log(`Generating bracket: ${numPlayers} players, bracket size ${bracketSize}, ${numMatchesFirstRound} first-round matches, ${numByes} BYEs`);

    // ============================================================
    // STANDARD TOURNAMENT SEEDING POSITIONS
    // ============================================================
    // This is the standard seeding used in tennis, squash, etc.
    // Example for 8 matches (16-player bracket):
    //   Match 1: Seed 1 vs unseeded  →  Seed 1 at top
    //   Match 8: Seed 2 vs unseeded  →  Seed 2 at bottom (meet #1 in final)
    //   Match 4: Seed 3 vs unseeded  →  In opposite half from #1 (meet in semis)
    //   Match 5: Seed 4 vs unseeded  →  In opposite half from #2 (meet in semis)
    //   And so on for seeds 5-8...
    // ============================================================

    /**
     * Generate standard seeding match positions
     * Returns array where index = seed rank (0-based), value = match number (1-based)
     * For 8 positions: [1, 8, 4, 5, 2, 7, 3, 6]
     *   - Seed 1 → Match 1
     *   - Seed 2 → Match 8
     *   - Seed 3 → Match 4
     *   - Seed 4 → Match 5
     *   - etc.
     */
    const getStandardSeedPositions = (numPositions) => {
        if (numPositions === 1) return [1];

        const positions = [1];

        for (let round = 1; round <= Math.log2(numPositions); round++) {
            const sum = Math.pow(2, round) + 1;
            const newPositions = [];

            for (let i = 0; i < positions.length; i++) {
                newPositions.push(positions[i]);
                newPositions.push(sum - positions[i]);
            }

            positions.length = 0;
            positions.push(...newPositions);

            if (positions.length >= numPositions) break;
        }

        return positions.slice(0, numPositions);
    };

    // Get seeding positions - this tells us which match each seed goes to
    const seedMatchPositions = getStandardSeedPositions(numMatchesFirstRound);
    console.log('Seed positions:', seedMatchPositions);

    // Separate seeded and unseeded players
    const seededPlayers = registrations
        .filter(r => r.seed && r.seed > 0)
        .sort((a, b) => a.seed - b.seed);

    const unseededPlayers = registrations
        .filter(r => !r.seed || r.seed <= 0)
        .sort(() => Math.random() - 0.5); // Shuffle unseeded players

    console.log(`Seeded players: ${seededPlayers.length}, Unseeded players: ${unseededPlayers.length}`);

    // ============================================================
    // PLAYER ASSIGNMENT ALGORITHM
    // ============================================================
    // Each match needs player1 (top position) and player2 (bottom position)
    // - Seeded players go to player1 position in their designated match
    // - BYEs go to player2 position of top seed matches (so seeds get BYEs)
    // - Remaining unseeded players fill remaining spots
    // ============================================================

    // Initialize matches array: [{ p1: null, p2: null }, ...]
    const matchAssignments = [];
    for (let i = 0; i < numMatchesFirstRound; i++) {
        matchAssignments.push({ p1: null, p2: null });
    }

    // Step 1: Place seeded players in their designated matches (p1 position)
    for (let seedRank = 0; seedRank < seededPlayers.length && seedRank < seedMatchPositions.length; seedRank++) {
        const matchNumber = seedMatchPositions[seedRank]; // 1-based
        const matchIndex = matchNumber - 1; // 0-based
        matchAssignments[matchIndex].p1 = seededPlayers[seedRank];
        console.log(`Seed ${seedRank + 1} (${seededPlayers[seedRank].registration_name || 'Unknown'}) → Match ${matchNumber}`);
    }

    // Step 2: Assign BYEs to matches with top seeds
    // BYEs go to the p2 position of matches with seeds (prioritizing top seeds)
    let byesAssigned = 0;
    for (let seedRank = 0; seedRank < seedMatchPositions.length && byesAssigned < numByes; seedRank++) {
        const matchNumber = seedMatchPositions[seedRank];
        const matchIndex = matchNumber - 1;

        // Only assign BYE if this match has a seeded player
        if (matchAssignments[matchIndex].p1 !== null && matchAssignments[matchIndex].p2 === null) {
            // p2 stays null = BYE (seeded player auto-advances)
            byesAssigned++;
            console.log(`BYE assigned to Match ${matchNumber} (Seed ${seedRank + 1} advances)`);
        }
    }

    // If we still have BYEs to assign, assign to remaining matches with seeded players
    if (byesAssigned < numByes) {
        for (let i = 0; i < numMatchesFirstRound && byesAssigned < numByes; i++) {
            if (matchAssignments[i].p1 !== null && matchAssignments[i].p2 === null) {
                byesAssigned++;
                console.log(`Extra BYE assigned to Match ${i + 1}`);
            }
        }
    }

    // Step 3: Fill remaining spots with unseeded players
    let unseededIndex = 0;

    // First pass: fill p1 positions that are empty (matches without seeds)
    for (let i = 0; i < numMatchesFirstRound && unseededIndex < unseededPlayers.length; i++) {
        if (matchAssignments[i].p1 === null) {
            matchAssignments[i].p1 = unseededPlayers[unseededIndex++];
        }
    }

    // Second pass: fill p2 positions that are empty (opponents for seeds and unseeded)
    for (let i = 0; i < numMatchesFirstRound && unseededIndex < unseededPlayers.length; i++) {
        if (matchAssignments[i].p2 === null) {
            matchAssignments[i].p2 = unseededPlayers[unseededIndex++];
        }
    }

    // Log final assignments
    console.log('Final match assignments:');
    matchAssignments.forEach((match, i) => {
        const p1Name = match.p1?.registration_name || match.p1?.member?.name || 'NULL';
        const p2Name = match.p2 ? (match.p2.registration_name || match.p2.member?.name || 'Opponent') : 'BYE';
        console.log(`  Match ${i + 1}: ${p1Name} vs ${p2Name}`);
    });

    const brackets = [];
    const allMatches = [];

    // Helper to create all brackets first
    // Note: This logic is reused from original code but wrapped in this function
    const createBrackets = (start, end, isMain = false) => {
        const size = end - start + 1;
        if (size < 2) return;

        // Note: Logic moved to iterative "definedRanges" below in original, 
        // copying the robust iterative version here directly.
    };

    // Correct bracket definition for full classification (Iterative Approach)
    const definedRanges = new Set();
    const rangeQueue = [{ s: 1, e: bracketSize, main: true }];

    while (rangeQueue.length > 0) {
        const { s, e, main } = rangeQueue.shift();
        const key = `${s} - ${e}`;
        if (definedRanges.has(key)) continue;
        definedRanges.add(key);

        const size = e - s + 1;
        const name = main ? 'Cuadro Principal' : `Puestos ${s} - ${e}`;
        const bId = crypto.randomUUID();

        brackets.push({
            id: bId,
            category_id: categoryId,
            bracket_type: main ? 'main' : 'classification',
            name,
            consolation_level: main ? 0 : s,
            range_start: s,
            range_end: e
        });

        if (size >= 4) {
            // Prioritize higher classification brackets
            for (let r = 2; r <= size / 2; r *= 2) {
                rangeQueue.push({ s: s + r, e: s + (r * 2) - 1, main: false });
            }
        }
    }

    // Insert Brackets
    const { data: createdBrackets, error: bError } = await supabase
        .from('tournament_brackets')
        .insert(brackets.map(b => ({
            category_id: b.category_id,
            bracket_type: b.bracket_type,
            name: b.name,
            consolation_level: b.consolation_level
        })))
        .select();
    if (bError) throw bError;

    if (brackets.length === 6 && bracketSize > 8) {
        console.warn('Límite de 6 cuadros alcanzado.');
    }

    // Map ranges to created bracket IDs
    const bracketMap = {};
    createdBrackets.forEach(b => {
        const range = brackets.find(orig => orig.name === b.name);
        if (range) bracketMap[`${range.range_start} - ${range.range_end}`] = b.id;
    });

    // ============================================================
    // FIRST ROUND MATCH ASSIGNMENTS WITH SEEDING AND BYEs
    // ============================================================
    // matchAssignments already contains the correct player assignments
    // Now we need to create the match records with BYE handling

    const mainFirstRoundAssignments = [];

    for (let matchIdx = 0; matchIdx < numMatchesFirstRound; matchIdx++) {
        const match = matchAssignments[matchIdx];
        const p1 = match.p1;
        const p2 = match.p2;

        const assignment = {
            p1: p1,
            p2: p2,
            status: 'pending',
            winner: null
        };

        // Handle BYE: if one player is null, the other wins automatically
        if (p1 && !p2) {
            assignment.status = 'completed';
            assignment.winner = p1.id;
            console.log(`Match ${matchIdx + 1}: ${p1.registration_name || 'Player'} advances with BYE`);
        } else if (p2 && !p1) {
            assignment.status = 'completed';
            assignment.winner = p2.id;
            console.log(`Match ${matchIdx + 1}: ${p2.registration_name || 'Player'} advances with BYE`);
        }

        mainFirstRoundAssignments.push(assignment);
    }

    console.log(`Created ${mainFirstRoundAssignments.length} first round match assignments`);

    // Generate Matches for each bracket
    createdBrackets.forEach(b => {
        const range = brackets.find(orig => orig.name === b.name);
        if (!range) return;
        const size = range.range_end - range.range_start + 1;

        for (let r = size / 2; r >= 1; r /= 2) {
            for (let p = 1; p <= r; p++) {
                const isFirstRoundMain = b.bracket_type === 'main' && r === bracketSize / 2;
                let p1 = null, p2 = null, status = 'pending', winner = null, score_summary = null;

                if (isFirstRoundMain) {
                    const assign = mainFirstRoundAssignments[p - 1];
                    if (assign) {
                        p1 = assign.p1;
                        p2 = assign.p2;
                        status = assign.status;
                        winner = assign.winner;
                        if (status === 'completed') score_summary = 'W.O.';
                    }
                }

                allMatches.push({
                    bracket_id: b.id,
                    round: r,
                    position: p,
                    player1_id: p1?.id || null,
                    player2_id: p2?.id || null,
                    winner_id: winner || null,
                    status,
                    score_summary,
                    _range_s: range.range_start,
                    _range_e: range.range_end
                });
            }
        }
    });

    const { data: createdMatches, error: mError } = await supabase
        .from('tournament_matches')
        .insert(allMatches.map(({ _range_s, _range_e, ...m }) => m))
        .select();
    if (mError) throw mError;

    // Link Matches
    const updatesMap = {}; // Group updates by match ID to avoid overwriting

    createdMatches.forEach(m => {
        const orig = allMatches.find(o => o.bracket_id === m.bracket_id && o.round === m.round && o.position === m.position);
        if (!orig) return;
        const { _range_s: s, _range_e: e } = orig;
        const r = m.round;
        const p = m.position;

        if (!updatesMap[m.id]) updatesMap[m.id] = {};

        // Winner advancement
        if (r > 1) {
            const nextMatch = createdMatches.find(nm =>
                nm.bracket_id === m.bracket_id &&
                nm.round === r / 2 &&
                nm.position === Math.ceil(p / 2)
            );
            if (nextMatch) {
                updatesMap[m.id].winner_next_match_id = nextMatch.id;
                updatesMap[m.id].winner_next_position = p % 2 === 1 ? 1 : 2;
            }
        }

        // Loser advancement
        if (r > 1) {
            const loserRangeS = s + r;
            const loserRangeE = s + (r * 2) - 1;
            const loserBracketId = bracketMap[`${loserRangeS} - ${loserRangeE}`];

            if (loserBracketId) {
                const loserNextMatch = createdMatches.find(lm =>
                    lm.bracket_id === loserBracketId &&
                    lm.round === r / 2 &&
                    lm.position === Math.ceil(p / 2)
                );

                if (loserNextMatch) {
                    updatesMap[m.id].loser_next_match_id = loserNextMatch.id;
                    updatesMap[m.id].loser_next_position = p % 2 === 1 ? 1 : 2;
                }
            }
        }
    });

    // Batch update links once per match
    for (const [id, update] of Object.entries(updatesMap)) {
        if (Object.keys(update).length > 0) {
            await supabase.from('tournament_matches').update(update).eq('id', id);
        }
    }

    // Propagate BYEs - Fetch full state with links first
    const { data: finalMatches } = await supabase
        .from('tournament_matches')
        .select('*')
        .in('id', createdMatches.map(m => m.id));

    for (const m of finalMatches) {
        if (m.status === 'completed') {
            if (m.winner_next_match_id) {
                await advancePlayer(m.winner_next_match_id, m.winner_next_position, m.winner_id);
            }
            if (m.loser_next_match_id) {
                const loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                await advancePlayer(m.loser_next_match_id, m.loser_next_position, loserId);
            }
        }
    }
};

// linkBracketMatches y generateConsolationBrackets eliminados
// La lógica ahora está integrada en generateDraw de forma recursiva


// generateConsolationBrackets eliminada


// ============================================================
// RESULT ENTRY
// ============================================================

export const recordMatchResult = async (matchId, winnerId, score) => {
    // Get the current match
    const match = await getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    // Calculate score summary (e.g., "3-1")
    const p1Sets = score.filter(s => s.p1 > s.p2).length;
    const p2Sets = score.filter(s => s.p2 > s.p1).length;
    const scoreSummary = match.player1_id === winnerId
        ? `${p1Sets} - ${p2Sets}`
        : `${p2Sets} - ${p1Sets}`;

    // Update the match
    await updateMatch(matchId, {
        winner_id: winnerId,
        score: score,
        score_summary: scoreSummary,
        status: 'completed'
    });

    // Handle loser moving to consolation if applicable
    if (match.loser_next_match_id) {
        const loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
        await advancePlayer(match.loser_next_match_id, match.loser_next_position, loserId);
    }

    // Advance winner to next match
    if (match.winner_next_match_id) {
        await advancePlayer(match.winner_next_match_id, match.winner_next_position, winnerId);
    }
};

export const clearMatchResult = async (matchId) => {
    const match = await getMatchById(matchId);
    if (!match) throw new Error('Match not found');

    // 1. Clear current match
    await updateMatch(matchId, {
        winner_id: null,
        score: null,
        score_summary: null,
        status: 'pending'
    });

    // 2. Clear winner from next match recursively
    if (match.winner_next_match_id) {
        await clearPlayerFromMatch(match.winner_next_match_id, match.winner_next_position);
    }

    // 3. Clear loser from next match recursively
    if (match.loser_next_match_id) {
        await clearPlayerFromMatch(match.loser_next_match_id, match.loser_next_position);
    }
};

const clearPlayerFromMatch = async (matchId, position) => {
    const updateField = position === 1 ? 'player1_id' : 'player2_id';

    // Get match state before clearing
    const match = await getMatchById(matchId);
    if (!match) return;

    // Record if this match was already completed
    const wasCompleted = match.status === 'completed';

    // Update match
    await updateMatch(matchId, {
        [updateField]: null,
        winner_id: null,
        status: 'pending',
        score: null,
        score_summary: null
    });

    // If it was completed, we need to clear its next matches too
    if (wasCompleted) {
        if (match.winner_next_match_id) {
            await clearPlayerFromMatch(match.winner_next_match_id, match.winner_next_position);
        }
        if (match.loser_next_match_id) {
            await clearPlayerFromMatch(match.loser_next_match_id, match.loser_next_position);
        }
    }
};

/**
 * Handles moving a player to a specific slot in a match and checks for BYEs
 */
export const advancePlayer = async (matchId, position, playerId) => {
    const updateField = position === 1 ? 'player1_id' : 'player2_id';
    const opponentPosition = position === 1 ? 2 : 1;
    const opponentField = opponentPosition === 1 ? 'player1_id' : 'player2_id';

    // 1. Update the match with the player
    const { data: currentMatch, error: updateError } = await supabase
        .from('tournament_matches')
        .update({ [updateField]: playerId })
        .eq('id', matchId)
        .select('*')
        .single();

    if (updateError) throw updateError;

    // 2. Check if the opponent side is a BYE or already has a winner waiting
    if (!currentMatch[opponentField]) {
        // Find if there is any match that feeds into the opponent slot (either winner or loser)
        const { data: incomingMatches } = await supabase
            .from('tournament_matches')
            .select(`
                id, status, winner_id, player1_id, player2_id,
            winner_next_match_id, winner_next_position,
            loser_next_match_id, loser_next_position
            `)
            .or(`winner_next_match_id.eq.${matchId}, loser_next_match_id.eq.${matchId}`);

        // Filter those that feed the specific opponent position
        const feedsOpponent = incomingMatches?.filter(m =>
            (m.winner_next_match_id === matchId && m.winner_next_position === opponentPosition) ||
            (m.loser_next_match_id === matchId && m.loser_next_position === opponentPosition)
        ) || [];

        const hasIncomingMatch = feedsOpponent.length > 0;

        // Check if any incoming match is already finished and has a player to send here
        let incomingPlayerId = null;
        let allIncomingFinishedAndDead = hasIncomingMatch;

        for (const m of feedsOpponent) {
            if (m.status === 'completed') {
                // If it feeds as winner
                if (m.winner_next_match_id === matchId && m.winner_next_position === opponentPosition) {
                    if (m.winner_id) incomingPlayerId = m.winner_id;
                }
                // If it feeds as loser
                else if (m.loser_next_match_id === matchId && m.loser_next_position === opponentPosition) {
                    const loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                    if (loserId) incomingPlayerId = loserId;
                }
            } else {
                allIncomingFinishedAndDead = false;
            }
        }

        if (incomingPlayerId) {
            // The opponent is ready! Pull them in.
            return await advancePlayer(matchId, opponentPosition, incomingPlayerId);
        }

        // If no match will ever produce an opponent, it's a BYE
        if (!hasIncomingMatch || (feedsOpponent.length > 0 && allIncomingFinishedAndDead && !incomingPlayerId)) {
            await updateMatch(matchId, {
                winner_id: playerId,
                status: 'completed',
                score_summary: 'W.O.'
            });

            if (currentMatch.winner_next_match_id) {
                await advancePlayer(currentMatch.winner_next_match_id, currentMatch.winner_next_position, playerId);
            }
            if (currentMatch.loser_next_match_id) {
                await advancePlayer(currentMatch.loser_next_match_id, currentMatch.loser_next_position, null);
            }
            return;
        }
    } else {
        // Opponent is there. If we just sent a NULL, the opponent has a BYE!
        if (!playerId && currentMatch.status !== 'completed') {
            const opponentId = currentMatch[opponentField];
            await updateMatch(matchId, {
                winner_id: opponentId,
                status: 'completed',
                score_summary: 'W.O.'
            });
            if (currentMatch.winner_next_match_id) {
                await advancePlayer(currentMatch.winner_next_match_id, currentMatch.winner_next_position, opponentId);
            }
            if (currentMatch.loser_next_match_id) {
                await advancePlayer(currentMatch.loser_next_match_id, currentMatch.loser_next_position, null);
            }
        }
    }

    // 3. Both players are present
    if (currentMatch.player1_id && currentMatch.player2_id) {
        // If it was completed (maybe from a previous W.O. state), reset to pending
        if (currentMatch.status === 'completed' && !currentMatch.score) {
            await updateMatch(matchId, {
                status: 'pending',
                winner_id: null,
                score_summary: null
            });
        }
    }
};

// ============================================================
// UTILITIES
// ============================================================

const generateSlug = (name) => {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36);
};

export const getRoundName = (round, totalRounds) => {
    const names = {
        1: 'Final',
        2: 'Semifinales',
        4: 'Cuartos de Final',
        8: 'Octavos de Final',
        16: 'Dieciseisavos',
        32: 'Treintaidosavos',
    };
    return names[round] || `Ronda de ${round}`;
};

// ============================================================
// PLAYER SWAPPING
// ============================================================

/**
 * Swap players between bracket matches
 * @param {string} match1Id - ID of first match
 * @param {string} slot1 - 'player1' or 'player2' in first match
 * @param {string} match2Id - ID of second match  
 * @param {string} slot2 - 'player1' or 'player2' in second match
 */
export const swapPlayersInBracket = async (match1Id, slot1, match2Id, slot2) => {
    try {
        // Fetch both matches
        const { data: match1, error: error1 } = await supabase
            .from('tournament_matches')
            .select('*')
            .eq('id', match1Id)
            .single();

        const { data: match2, error: error2 } = await supabase
            .from('tournament_matches')
            .select('*')
            .eq('id', match2Id)
            .single();

        if (error1 || error2) {
            throw new Error('Error al obtener los partidos');
        }

        // Get player IDs to swap
        const player1IdToSwap = match1[`${slot1}_id`];
        const player2IdToSwap = match2[`${slot2}_id`];

        // Update first match
        const { error: updateError1 } = await supabase
            .from('tournament_matches')
            .update({ [`${slot1}_id`]: player2IdToSwap })
            .eq('id', match1Id);

        // Update second match
        const { error: updateError2 } = await supabase
            .from('tournament_matches')
            .update({ [`${slot2}_id`]: player1IdToSwap })
            .eq('id', match2Id);

        if (updateError1 || updateError2) {
            throw new Error('Error al intercambiar jugadores en los partidos');
        }

        return { success: true };
    } catch (error) {
        console.error('Error swapping players in bracket:', error);
        throw error;
    }
};

/**
 * Swap players within a group
 * @param {string} groupId - ID of the group
 * @param {string} player1Id - Registration ID of first player
 * @param {string} player2Id - Registration ID of second player
 */
export const swapPlayersInGroup = async (groupId, player1Id, player2Id) => {
    try {
        console.log('🔄 Swap players in group:', { groupId, player1Id, player2Id });

        // Fetch both group player records
        const { data: groupPlayers, error: fetchError } = await supabase
            .from('tournament_group_players')
            .select('*')
            .eq('group_id', groupId)
            .in('registration_id', [player1Id, player2Id]);

        console.log('📊 Found group players:', groupPlayers);

        if (fetchError) {
            console.error('❌ Fetch error:', fetchError);
            throw new Error('Error al obtener los jugadores del grupo: ' + fetchError.message);
        }

        if (!groupPlayers || groupPlayers.length !== 2) {
            console.error('❌ Invalid number of players found:', groupPlayers?.length);
            throw new Error(`Se esperaban 2 jugadores pero se encontraron ${groupPlayers?.length || 0}. Verifica que ambos jugadores estén en el grupo ${groupId}.`);
        }

        const groupPlayer1 = groupPlayers.find(gp => gp.registration_id === player1Id);
        const groupPlayer2 = groupPlayers.find(gp => gp.registration_id === player2Id);

        // Swap positions and stats
        const tempPosition = groupPlayer1.position;
        const tempPoints = groupPlayer1.points;
        const tempGamesWon = groupPlayer1.games_won;
        const tempGamesLost = groupPlayer1.games_lost;

        const { error: updateError1 } = await supabase
            .from('tournament_group_players')
            .update({
                position: groupPlayer2.position,
                points: groupPlayer2.points,
                games_won: groupPlayer2.games_won,
                games_lost: groupPlayer2.games_lost
            })
            .eq('id', groupPlayer1.id);

        const { error: updateError2 } = await supabase
            .from('tournament_group_players')
            .update({
                position: tempPosition,
                points: tempPoints,
                games_won: tempGamesWon,
                games_lost: tempGamesLost
            })
            .eq('id', groupPlayer2.id);

        if (updateError1 || updateError2) {
            throw new Error('Error al intercambiar jugadores en el grupo');
        }

        // Now swap players in all group matches
        const { data: groupMatches, error: matchesFetchError } = await supabase
            .from('tournament_group_matches')
            .select('*')
            .eq('group_id', groupId)
            .or(`player1_id.eq.${player1Id},player2_id.eq.${player1Id},player1_id.eq.${player2Id},player2_id.eq.${player2Id}`);

        if (matchesFetchError) {
            throw new Error('Error al obtener los partidos del grupo');
        }

        // Update each match that involves either player
        for (const match of groupMatches) {
            let updates = {};

            if (match.player1_id === player1Id) {
                updates.player1_id = player2Id;
            } else if (match.player1_id === player2Id) {
                updates.player1_id = player1Id;
            }

            if (match.player2_id === player1Id) {
                updates.player2_id = player2Id;
            } else if (match.player2_id === player2Id) {
                updates.player2_id = player1Id;
            }

            if (Object.keys(updates).length > 0) {
                const { error: matchUpdateError } = await supabase
                    .from('tournament_group_matches')
                    .update(updates)
                    .eq('id', match.id);

                if (matchUpdateError) {
                    throw new Error(`Error al actualizar partido ${match.id}`);
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error('Error swapping players in group:', error);
        throw error;
    }
};
