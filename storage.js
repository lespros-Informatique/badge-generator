// Storage utility for managing members data with Supabase
// Cloud-only storage (no localStorage cache)


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
    if (!supabase) {
        console.warn('Supabase not configured');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .order('dateInscription', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Erreur Supabase:', error);
        return [];
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
        throw new Error('Supabase non configuré. Impossible d\'ajouter un membre.');
    }

    try {
        const { data, error } = await supabase
            .from('members')
            .insert([newMember])
            .select();

        if (error) throw error;

        return newMember;
    } catch (error) {
        console.error('Erreur ajout Supabase:', error);
        throw new Error('Impossible de sauvegarder sur Supabase. Vérifiez votre connexion.');
    }
}

// Update a member in Supabase
async function updateMember(id, memberData) {
    if (!supabase) {
        throw new Error('Supabase non configuré. Impossible de modifier un membre.');
    }

    try {
        const { data, error } = await supabase
            .from('members')
            .update(memberData)
            .eq('id', id)
            .select();

        if (error) throw error;

        return data[0];
    } catch (error) {
        console.error('Erreur modification Supabase:', error);
        throw error;
    }
}

// Delete a member from Supabase
async function deleteMember(id) {
    if (!supabase) {
        throw new Error('Supabase non configuré. Impossible de supprimer un membre.');
    }

    try {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return true;
    } catch (error) {
        console.error('Erreur suppression Supabase:', error);
        throw error;
    }
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
                        resolve(data.members);
                    } else {
                        reject(new Error('Supabase non configuré'));
                    }
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
