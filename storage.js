// Storage utility for managing members data with Supabase
// Centralized cloud storage

const STORAGE_KEY = 'badge_members_cache'; // Local cache

// Initialize Supabase client
let supabase;
try {
    if (typeof SUPABASE_CONFIG !== 'undefined' && window.supabase) {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
    }
} catch (e) {
    console.error('Supabase initialization failed:', e);
}

// Generate unique ID
function generateId() {
    return 'member_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================
// SUPABASE API FUNCTIONS
// ============================================

// Fetch all members from Supabase
async function fetchMembersFromCloud() {
    if (!supabase) return getAllMembersLocal();

    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('dateInscription', { ascending: false });

        if (error) throw error;

        // Cache locally
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ members: data }));

        return data || [];
    } catch (error) {
        console.error('Erreur Supabase:', error);
        // Fallback to local cache
        return getAllMembersLocal();
    }
}

// Add a new member to Supabase
async function addMember(memberData) {
    const newMember = {
        id: generateId(),
        ...memberData,
        dateInscription: new Date().toISOString()
    };

    if (!supabase) {
        // Offline mode or config missing
        const members = getAllMembersLocal();
        members.push(newMember);
        saveMembersLocal(members);
        return newMember;
    }

    try {
        const { data, error } = await supabase
            .from('members')
            .insert([newMember])
            .select();

        if (error) throw error;

        // Update local cache
        const members = getAllMembersLocal();
        members.unshift(newMember);
        saveMembersLocal(members);

        return newMember;
    } catch (error) {
        console.error('Erreur ajout Supabase:', error);
        throw new Error('Impossible de sauvegarder sur Supabase. Vérifiez votre connexion.');
    }
}

// Update a member in Supabase
async function updateMember(id, memberData) {
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from('members')
            .update(memberData)
            .eq('id', id)
            .select();

        if (error) throw error;

        // Update local cache
        const members = getAllMembersLocal();
        const index = members.findIndex(m => m.id === id);
        if (index !== -1) {
            members[index] = { ...members[index], ...memberData };
            saveMembersLocal(members);
        }

        return data[0];
    } catch (error) {
        console.error('Erreur modification Supabase:', error);
        throw error;
    }
}

// Delete a member from Supabase
async function deleteMember(id) {
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Update local cache
        const members = getAllMembersLocal();
        const filtered = members.filter(m => m.id !== id);
        saveMembersLocal(filtered);

        return true;
    } catch (error) {
        console.error('Erreur suppression Supabase:', error);
        throw error;
    }
}

// ============================================
// LOCAL STORAGE FUNCTIONS (Fallback/Cache)
// ============================================

function getAllMembersLocal() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    try {
        const parsed = JSON.parse(data);
        return parsed.members || [];
    } catch (e) {
        return [];
    }
}

function saveMembersLocal(members) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ members }));
}

// ============================================
// PUBLIC API
// ============================================

// Get all members
async function getAllMembers() {
    return await fetchMembersFromCloud();
}

// Get a single member by ID
async function getMember(id) {
    const members = await getAllMembers();
    return members.find(m => m.id === id);
}

// Export members to JSON file
async function exportToJSON() {
    const members = await getAllMembers();
    const data = {
        members: members,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `members_supabase_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Import members from JSON file (saves to Supabase)
function importFromJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.members && Array.isArray(data.members)) {
                    // Batch insert to Supabase
                    if (supabase) {
                        const { error } = await supabase
                            .from('members')
                            .upsert(data.members);

                        if (error) throw error;
                    }

                    // Update local
                    saveMembersLocal(data.members);
                    resolve(data.members);
                } else {
                    reject(new Error('Format de fichier invalide'));
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
        reader.readAsText(file);
    });
}

// Check if API is configured
function isAPIConfigured() {
    return typeof SUPABASE_CONFIG !== 'undefined' &&
        SUPABASE_CONFIG.URL !== '' &&
        SUPABASE_CONFIG.KEY !== '';
}
