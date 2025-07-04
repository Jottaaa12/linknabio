class SoundManager {
    constructor() {
        this.sounds = {
            correct: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbUwHc6AAAAAAD/+9DEAAAKmQF79PAAA0o3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA'),
            wrong: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbNhxy6AAAAAAD/+9DEAAAKmQF79PAAA0o3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA'),
            achievement: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbvth1KAAAAAAD/+9DEAAAKmP159PKAA0A3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA'),
            difficulty: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbUwHc6AAAAAAD/+9DEAAAKmQF79PAAA0o3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA'),
            timerWarning: new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAAYbNhxy6AAAAAAD/+9DEAAAKmQF79PAAA0o3r785gBAAAA0gAAAABE4qwAAAAABPwoAAAAAANIAAAAAAAAAAAAAAAAAAAAA')
        };

        // Configurar volume para todos os sons
        this.setVolume(0.3);

        // Estado do som
        this.isMuted = localStorage.getItem('soundMuted') === 'true';
        this.updateMuteState();
    }

    setVolume(volume) {
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        localStorage.setItem('soundMuted', this.isMuted);
        this.updateMuteState();
    }

    updateMuteState() {
        Object.values(this.sounds).forEach(sound => {
            sound.muted = this.isMuted;
        });

        // Atualizar ícone do botão de som se existir
        const soundButton = document.getElementById('sound-toggle');
        if (soundButton) {
            const icon = soundButton.querySelector('i');
            icon.className = this.isMuted ? 'fas fa-volume-mute' : 'fas fa-volume-up';
        }
    }

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(() => {}); // Ignorar erros de reprodução (comum em mobile)
        }
    }
}

// Inicializar gerenciador de sons
window.soundManager = new SoundManager(); 
