(() => {
  "use strict";

  const friends = [
    { name: "Zerak", color: "#9b65ff", role: "THE ORIGINAL", quote: "A unique personality and a friend worth keeping forever." },
    { name: "Asad", color: "#258de8", role: "THE CHAMPION", quote: "Every friendship needs someone who brings positive energy." },
    { name: "Ahmad", color: "#e2a343", role: "THE LEGEND", quote: "A friendship that makes ordinary days extraordinary." },
    { name: "Ayaz", color: "#22b8a0", role: "THE ADVENTURER", quote: "Good times become great when friends are together." },
    { name: "Tahsseen", color: "#e45b91", role: "THE STAR", quote: "Memories are better when shared with real friends." },
    { name: "Zia ur Rehman", color: "#d46c44", role: "THE GENTLEMAN", quote: "A true friend makes every journey meaningful." },
    { name: "Zeeshan", color: "#4e9b85", role: "THE CREATOR", quote: "Making ordinary moments part of an extraordinary story." },
    { name: "Sunny", color: "#c18a36", role: "THE SUNSHINE", quote: "Bringing a little brightness to every gathering." }
  ];

  const $ = (id) => document.getElementById(id);
  const grid = $("friendGrid");
  const search = $("friendSearch");
  const dialog = $("friendDialog");
  let supabaseClient = null;
  let cloudReady = false;

  function renderFriends(items) {
    grid.replaceChildren();
    if (!items.length) {
      const message = document.createElement("p");
      message.className = "empty-state";
      message.textContent = "No friends found. Try another name.";
      grid.append(message);
      return;
    }
    items.forEach((friend) => {
      const card = document.createElement("article");
      card.className = "friend-card";
      card.style.setProperty("--accent", friend.color);

      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = friend.name.charAt(0).toUpperCase();

      const name = document.createElement("h3");
      name.textContent = friend.name;

      const role = document.createElement("div");
      role.className = "friend-role";
      role.textContent = friend.role;

      const quote = document.createElement("p");
      quote.className = "friend-quote";
      quote.textContent = `“${friend.quote}”`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "profile-button";
      button.textContent = "VIEW PROFILE ↗";
      button.addEventListener("click", () => openProfile(friend));

      card.append(avatar, name, role, quote, button);
      grid.append(card);
    });
  }

  function openProfile(friend) {
    $("dialogAvatar").textContent = friend.name.charAt(0).toUpperCase();
    $("dialogAvatar").style.setProperty("--accent", friend.color);
    $("dialogName").textContent = friend.name;
    $("dialogQuote").textContent = friend.quote;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function setStatus(message, type) {
    const status = $("storageStatus");
    status.textContent = message;
    status.dataset.state = type || "info";
  }

  function escapeText(value) {
    return String(value ?? "");
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
  }

  function renderMemories(rows) {
    const list = $("memoryList");
    list.replaceChildren();
    $("memoryCount").textContent = `${rows.length} ${rows.length === 1 ? "memory" : "memories"}`;
    if (!rows.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No memories yet. Add the first one above!";
      list.append(empty);
      return;
    }
    rows.forEach((row) => {
      const item = document.createElement("article");
      item.className = "memory-item";
      const content = document.createElement("p");
      content.textContent = escapeText(row.content);
      const meta = document.createElement("div");
      meta.className = "memory-meta";
      meta.textContent = `${escapeText(row.author || "A friend")} • ${formatDate(row.created_at)}`;
      item.append(content, meta);
      list.append(item);
    });
  }

  function localMemories() {
    try {
      return JSON.parse(localStorage.getItem("friendsClubLocalMemories") || "[]");
    } catch (_) {
      return [];
    }
  }

  async function loadMemories() {
    if (!cloudReady) {
      renderMemories(localMemories());
      setStatus("Local preview only — add your Supabase URL and public key in config.js to enable shared online memories.", "warning");
      return;
    }
    setStatus("Loading shared memories from the cloud…", "info");
    const { data, error } = await supabaseClient
      .from("friends_memories")
      .select("id, content, author, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) {
      renderMemories([]);
      setStatus(`Database could not load memories: ${error.message}`, "error");
      return;
    }
    renderMemories(data || []);
    setStatus("Connected — memories are shared through the online database.", "success");
  }

  async function addMemory(event) {
    event.preventDefault();
    const author = $("memoryName").value.trim();
    const content = $("memoryText").value.trim();
    if (!author || !content) {
      setStatus("Please enter your name and a memory.", "warning");
      return;
    }
    const button = $("saveMemory");
    button.disabled = true;
    button.textContent = "Saving…";
    try {
      if (cloudReady) {
        const { error } = await supabaseClient.from("friends_memories").insert([{ author, content }]);
        if (error) throw error;
        $("memoryForm").reset();
        await loadMemories();
        setStatus("Memory saved online and shared with everyone!", "success");
      } else {
        const rows = localMemories();
        rows.unshift({ author, content, created_at: new Date().toISOString() });
        localStorage.setItem("friendsClubLocalMemories", JSON.stringify(rows));
        $("memoryForm").reset();
        renderMemories(rows);
        setStatus("Saved only in this browser for preview. Configure Supabase for shared permanent online storage.", "warning");
      }
    } catch (error) {
      setStatus(`Could not save memory: ${error.message || "Unknown error"}`, "error");
    } finally {
      button.disabled = false;
      button.textContent = "Save memory ↗";
    }
  }

  function initSupabase() {
    const config = window.FRIENDS_CLUB_CONFIG || {};
    const validUrl = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/.test(config.supabaseUrl || "");
    const validKey = typeof config.supabaseKey === "string" &&
      config.supabaseKey.length > 20 &&
      !config.supabaseKey.includes("PASTE_YOUR_");
    if (!window.supabase || !validUrl || !validKey) {
      cloudReady = false;
      return;
    }
    try {
      supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
      cloudReady = true;
    } catch (error) {
      cloudReady = false;
      setStatus(`Supabase setup error: ${error.message}`, "error");
    }
  }

  function updateClock() {
    $("clock").textContent = `✦ ${new Date().toLocaleString()}`;
  }

  function init() {
    renderFriends(friends);
    search.addEventListener("input", () => {
      const query = search.value.trim().toLowerCase();
      renderFriends(friends.filter((friend) => friend.name.toLowerCase().includes(query)));
    });
    $("memoryForm").addEventListener("submit", addMemory);
    $("dialogClose").addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    $("menuToggle").addEventListener("click", () => {
      const nav = $("mainNav");
      const open = nav.classList.toggle("open");
      $("menuToggle").setAttribute("aria-expanded", String(open));
    });
    $("mainNav").querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        $("mainNav").classList.remove("open");
        $("menuToggle").setAttribute("aria-expanded", "false");
      });
    });
    updateClock();
    window.setInterval(updateClock, 1000);
    initSupabase();
    loadMemories();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
