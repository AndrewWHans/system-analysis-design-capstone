import { authFetch, removeToken } from "../utils/auth";
import profileHtml from "./templates/ProfilePage.html?raw";

export const renderProfilePage = () => {
    return profileHtml;
};

export const setupProfilePage = (navigate: (path: string) => void) => {
    let allSessions: any[] = []; // Store for filtering

    // Navigation logic
    document.getElementById('nav-logo')?.addEventListener('click', () => navigate('/'));
    document.getElementById('nav-chat')?.addEventListener('click', () => navigate('/chat'));
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        removeToken();
        navigate('/');
    });

    // Date helper
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString(undefined, { 
            year: 'numeric', month: 'short', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    };

    // Table renderer
    const renderTable = (sessions: any[]) => {
        const tbody = document.getElementById('recent-sessions-table')!;
        
        if (sessions.length > 0) {
            tbody.innerHTML = sessions.map((s: any) => {
                const status = s.endTime 
                    ? '<span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">Completed</span>'
                    : '<span class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Active</span>';
                
                let diagStatus = '<span class="text-gray-400">-</span>';
                if (s.finalDiagnosis) {
                    if (s.isDiagnosisCorrect) {
                        diagStatus = `<span class="text-green-600 font-medium">Correct (${s.finalDiagnosis.condition?.name})</span>`;
                    } else {
                        diagStatus = `<span class="text-red-500 font-medium">Incorrect (${s.finalDiagnosis.condition?.name})</span>`;
                    }
                }

                // Added cursor-pointer and data-id attribute
                return `
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer session-row" data-id="${s.id}">
                        <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">${formatDate(s.startTime)}</td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300">${s.scenario?.name || "Unknown Scenario"}</td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm">${status}</td>
                        <td class="whitespace-nowrap px-3 py-4 text-sm text-right pr-6">${diagStatus}</td>
                    </tr>
                `;
            }).join('');

            // Attach click listeners to rows
            tbody.querySelectorAll('.session-row').forEach(row => {
                row.addEventListener('click', () => {
                    const id = row.getAttribute('data-id');
                    if (id) {
                        navigate(`/chat?sessionId=${id}`);
                    }
                });
            });

        } else {
            tbody.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-sm text-gray-500 dark:text-gray-400 italic">No sessions found.</td></tr>`;
        }
    };

    const loadProfile = async () => {
        try {
            // Fetch stats & user info
            const profileRes = await authFetch('http://localhost:3000/me');
            if (profileRes.ok) {
                const data = await profileRes.json();
                const { user, stats } = data;

                // Update header info
                document.getElementById('username-display')!.textContent = user.username || "Therapist";
                document.getElementById('email-display')!.textContent = user.email || "";
                document.getElementById('user-avatar')!.textContent = (user.username || "U")[0].toUpperCase();

                // Update stats cards
                document.getElementById('stat-total')!.textContent = stats.totalStarted.toString();
                document.getElementById('stat-completed')!.textContent = stats.totalCompleted.toString();
                document.getElementById('stat-correct')!.textContent = stats.correctDiagnoses.toString();
                document.getElementById('stat-attempts')!.textContent = `Out of ${stats.totalDiagnoses} attempts`;
                document.getElementById('stat-accuracy')!.textContent = `${stats.accuracy}%`;
            }

            // Fetch full history for search/table
            const historyRes = await authFetch('http://localhost:3000/sessions');
            if (historyRes.ok) {
                allSessions = await historyRes.json();
                renderTable(allSessions);
            }

        } catch (e) {
            console.error(e);
        }
    };

    // Search listener
    const searchInput = document.getElementById('session-search') as HTMLInputElement;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.toLowerCase();
            const filtered = allSessions.filter(s => 
                (s.scenario?.name || '').toLowerCase().includes(query) || 
                formatDate(s.startTime).toLowerCase().includes(query) ||
                (s.finalDiagnosis?.condition?.name || '').toLowerCase().includes(query)
            );
            renderTable(filtered);
        });
    }

    loadProfile();
};