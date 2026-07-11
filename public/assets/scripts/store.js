(() => {
    const API_BASE = localStorage.getItem("skillswap-api-url") || "http://localhost:3000";
    const DATABASE_KEY = "skillswap-live-database";
    const SESSION_KEY = "skillswap-live-session";
    let mode = "local";
    let database;

    const clone = (value) => JSON.parse(JSON.stringify(value));

    const persistLocalDatabase = () => {
        localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
    };

    const loadSeedDatabase = async () => {
        const storedDatabase = localStorage.getItem(DATABASE_KEY);

        if (storedDatabase) {
            database = JSON.parse(storedDatabase);
            return;
        }

        const response = await fetch("../db.json");
        if (!response.ok) throw new Error("No se pudo cargar db.json");

        database = await response.json();
        persistLocalDatabase();
    };

    const init = async () => {
        if (database || mode === "api") return mode;

        try {
            const response = await fetch(`${API_BASE}/users?_limit=1`, {
                signal: AbortSignal.timeout(700),
            });

            if (!response.ok) throw new Error("API no disponible");
            mode = "api";
        } catch {
            mode = "local";
            await loadSeedDatabase();
        }

        return mode;
    };

    const request = async (path, options = {}) => {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });

        if (!response.ok) {
            throw new Error(`La operación falló con estado ${response.status}`);
        }

        return response.status === 204 ? null : response.json();
    };

    const list = async (collection, filters = {}) => {
        await init();

        if (mode === "api") {
            const query = new URLSearchParams(filters).toString();
            return request(`/${collection}${query ? `?${query}` : ""}`);
        }

        return clone((database[collection] || []).filter((item) => (
            Object.entries(filters).every(([key, value]) => String(item[key]) === String(value))
        )));
    };

    const get = async (collection, id) => {
        await init();

        if (mode === "api") return request(`/${collection}/${id}`);

        const item = (database[collection] || []).find((entry) => String(entry.id) === String(id));
        return item ? clone(item) : null;
    };

    const create = async (collection, payload) => {
        await init();

        if (mode === "api") {
            return request(`/${collection}`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }

        const items = database[collection] || (database[collection] = []);
        const numericIds = items.map((item) => Number(item.id)).filter(Number.isFinite);
        const item = {
            ...clone(payload),
            id: String((numericIds.length ? Math.max(...numericIds) : 0) + 1),
        };

        items.push(item);
        persistLocalDatabase();
        return clone(item);
    };

    const update = async (collection, id, changes) => {
        await init();

        if (mode === "api") {
            return request(`/${collection}/${id}`, {
                method: "PATCH",
                body: JSON.stringify(changes),
            });
        }

        const items = database[collection] || [];
        const index = items.findIndex((item) => String(item.id) === String(id));
        if (index < 0) throw new Error("Registro no encontrado");

        items[index] = { ...items[index], ...clone(changes) };
        persistLocalDatabase();
        return clone(items[index]);
    };

    const remove = async (collection, id) => {
        await init();

        if (mode === "api") {
            return request(`/${collection}/${id}`, { method: "DELETE" });
        }

        const items = database[collection] || [];
        const index = items.findIndex((item) => String(item.id) === String(id));
        if (index < 0) throw new Error("Registro no encontrado");

        items.splice(index, 1);
        persistLocalDatabase();
        return null;
    };

    const authenticate = async (email, password) => {
        const users = await list("users", { email });
        const user = users.find((item) => item.password === password);

        if (!user) throw new Error("Correo o contraseña incorrectos");

        localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
        return user;
    };

    const getCurrentUser = async () => {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
        return session?.userId ? get("users", session.userId) : null;
    };

    const setCurrentUser = (userId) => {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: String(userId) }));
    };

    const signOut = () => localStorage.removeItem(SESSION_KEY);

    const resetLocalData = () => {
        localStorage.removeItem(DATABASE_KEY);
        database = undefined;
    };

    window.SkillSwapStore = {
        init,
        list,
        get,
        create,
        update,
        remove,
        authenticate,
        getCurrentUser,
        setCurrentUser,
        signOut,
        resetLocalData,
        get mode() {
            return mode;
        },
    };
})();
