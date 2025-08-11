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
import org.springframework.web.bind.annotation.RestController;

import com.example.music_app_project.model.Artist;
import com.example.music_app_project.repository.ArtistRepository;

@RestController
@RequestMapping("/api/artists")
@CrossOrigin // Thêm dòng này để cho phép CORS
public class ArtistController {

    @Autowired
    private ArtistRepository artistRepository;

    // Get all artists
    @GetMapping
    public List<Artist> getAllArtists() {
        return artistRepository.findAll();
}

// Get artist by ID
@GetMapping("/{id}")
    public ResponseEntity<Artist> getArtistById(@PathVariable Integer id) {
        Optional<Artist> artist = artistRepository.findById(id);
        return artist.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
 }

    // Create a new artist
    @PostMapping
    public ResponseEntity<Artist> createArtist(@RequestBody Artist artist) {
        Artist savedArtist = artistRepository.save(artist);
        return ResponseEntity.ok(savedArtist);
    }

    // Update an artist
    @PutMapping("/{id}")
     public ResponseEntity<Artist> updateArtist(@PathVariable Integer id, @RequestBody Artist artistDetails) {
        Optional<Artist> existingArtistOpt = artistRepository.findById(id);
        if (existingArtistOpt.isEmpty()) {
           return ResponseEntity.notFound().build();
        }

        Artist existingArtist = existingArtistOpt.get();
        // Sửa các phương thức setter và getter để phù hợp với model Artist.java đã thay đổi
        existingArtist.setName(artistDetails.getName());
        existingArtist.setBio(artistDetails.getBio());
        existingArtist.setCountry(artistDetails.getCountry());
        existingArtist.setBirthDate(artistDetails.getBirthDate());

        Artist updatedArtist = artistRepository.save(existingArtist);
        return ResponseEntity.ok(updatedArtist);
     }

    // Delete an artist
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArtist(@PathVariable Integer id) {
       if (!artistRepository.existsById(id)) {
          return ResponseEntity.notFound().build();
        }
       artistRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}