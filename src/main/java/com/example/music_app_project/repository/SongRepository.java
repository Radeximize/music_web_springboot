package com.example.music_app_project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.music_app_project.model.Song;

@Repository
public interface SongRepository extends JpaRepository<Song, Integer> {

    @Query("SELECT s FROM Song s " +
           "WHERE (:searchTerm IS NULL OR :searchTerm = '' OR LOWER(s.title) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "AND (:genreId IS NULL OR s.genre.genreID = :genreId OR (:genreId = -1 AND s.genre IS NULL))")
    List<Song> findBySearchTermAndGenre(@Param("searchTerm") String searchTerm, @Param("genreId") Integer genreId);

    @Query("SELECT s FROM Song s WHERE s.artist IS NULL AND s.genre IS NOT NULL")
    List<Song> findSongsWithoutArtistButHasGenre();
}