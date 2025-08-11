package com.example.music_app_project.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.music_app_project.model.Song;
import com.example.music_app_project.repository.AlbumRepository;
import com.example.music_app_project.repository.ArtistRepository;
import com.example.music_app_project.repository.GenreRepository;
import com.example.music_app_project.repository.SongRepository;

@RestController
@RequestMapping("/api/songs")
@CrossOrigin(origins = "*")
public class SongController {

    @Autowired
    private SongRepository songRepository;
    @Autowired
    private ArtistRepository artistRepository;
    @Autowired
    private AlbumRepository albumRepository;
    @Autowired
    private GenreRepository genreRepository;

    // Get all songs with optional filters
    @GetMapping
public List<Song> getAllSongs(
        @RequestParam(required = false) String searchTerm,
        @RequestParam(required = false) String genre,
        @RequestParam(required = false) String artist) { // <-- thêm tham số mới

    // Nếu chọn option "Only songs without artist"
    if ("none".equalsIgnoreCase(artist)) {
        return songRepository.findSongsWithoutArtistButHasGenre();
    }

    Integer genreId = null;
    if (genre != null) {
        if ("unknown".equalsIgnoreCase(genre)) {
            genreId = -1; // lọc bài không có genre
        } else {
            try {
                genreId = Integer.parseInt(genre);
            } catch (NumberFormatException e) {
                genreId = null; 
            }
        }
    }

    boolean hasSearch = searchTerm != null && !searchTerm.trim().isEmpty();
    boolean hasGenre = genreId != null;

    if (hasSearch || hasGenre) {
        return songRepository.findBySearchTermAndGenre(searchTerm, genreId);
    }
    return songRepository.findAll();
}

    // Get song by ID
    @GetMapping("/{id}")
    public ResponseEntity<Song> getSongById(@PathVariable Integer id) {
        return songRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create a new song with an audio URL
    @PostMapping
    public ResponseEntity<Song> createSong(@RequestBody Song song) {
        if (!validateRelations(song)) {
            return ResponseEntity.badRequest().build();
        }
        Song savedSong = songRepository.save(song);
        return ResponseEntity.ok(savedSong);
    }

    // Update an existing song
    @PutMapping("/{id}")
    public ResponseEntity<Song> updateSong(@PathVariable Integer id, @RequestBody Song songDetails) {
        Optional<Song> existingOpt = songRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!validateRelations(songDetails)) {
            return ResponseEntity.badRequest().build();
        }
        Song existingSong = existingOpt.get();
        existingSong.setTitle(songDetails.getTitle());
        existingSong.setArtist(songDetails.getArtist());
        existingSong.setAlbum(songDetails.getAlbum());
        existingSong.setGenre(songDetails.getGenre());
        existingSong.setDuration(songDetails.getDuration());
        existingSong.setReleaseDate(songDetails.getReleaseDate());
        existingSong.setAudioFile(songDetails.getAudioFile());
        Song updated = songRepository.save(existingSong);
        return ResponseEntity.ok(updated);
    }

    // Delete song
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSong(@PathVariable Integer id) {
        if (!songRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        songRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Validate related entities exist
    private boolean validateRelations(Song song) {
        if (song.getArtist() != null && !artistRepository.existsById(song.getArtist().getArtistID())) {
            return false;
        }
        if (song.getAlbum() != null && !albumRepository.existsById(song.getAlbum().getAlbumID())) {
            return false;
        }
        if (song.getGenre() != null && !genreRepository.existsById(song.getGenre().getGenreID())) {
            return false;
        }
        return true;
    }
}