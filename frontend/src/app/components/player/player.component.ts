import { Component, Input, OnInit, Pipe, PipeTransform } from '@angular/core';
import * as numeral from "numeral";
import { Song } from 'src/app/models/Song';
import User from 'src/app/models/User';
import { CurrentSongService } from 'src/app/services/current-song/current-song.service';
import { CurrentUserService } from 'src/app/services/current-user/current-user.service';
import { SongService } from 'src/app/services/song/song.service';
import { UserService } from 'src/app/services/user/user.service';
import { getServerFileUrl } from 'src/app/utils/utils';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})

export class PlayerComponent implements OnInit {
    public audio : HTMLAudioElement
    public player : Element
    public currentTimePercentage : number = 0
    public window : any = window
    public showAddToPlaylist : boolean = false

    public paused : boolean = false
    public trackNum : number

    public song : Song
    public songs : Song[]
    public user : User
    public uri : string
    public coverUri : string

    public getServerFileUrl : Function = getServerFileUrl

    constructor(public currentSongService : CurrentSongService, private userService : UserService, private currentUserService : CurrentUserService, private songService : SongService) { }
    
    ngOnInit(): void {
        this.audio = document.getElementsByTagName("audio")[0]
        this.player = document.getElementsByClassName("player")[0]

        this.getData(this.currentSongService.songs)
        this.trackNum = 0
        this.setSong()
        this.pause()

        setInterval(() => {
            if (this.uri) {
                if (this.paused && !this.audio.paused) {
                    this.audio.pause()
                } else if (!this.paused && this.audio.paused) {
                    this.audio.play()
                }
            }

            if (this.audio) {
                this.currentTimePercentage = this.audio.currentTime / this.audio.duration * 100
            }
        }, 200)

        this.currentSongService.getSong().subscribe((songs : Song[]) => {
            this.getData(songs)
            this.trackNum = 0
            this.setSong()
            
            this.song = songs[0]
            this.play()
        })
    }

    changeTime (e : MouseEvent) {
        const xDifference : number = e.clientX - this.player.getBoundingClientRect().left
        const percentage : number = xDifference / this.player.clientWidth;
        
        this.audio.currentTime = this.audio.duration * percentage
    }

    getData (songs : Song[]) {
        this.songs = songs
    }

    getProgressMMSS () : string {
        const progress : number = this.currentTimePercentage / 100 * this.audio.duration
        
        if (this.getDurationMMSS(progress))
            return this.getDurationMMSS(progress)

        return ""
    }

    getDurationMMSS (duration : number) : string {
        const min : number = Math.floor(duration / 60)
        const sec : string = Math.floor(duration % 60).toString().padStart(2, "0") 
        return `${min}:${sec}`
    }
    

    changeVolume (value : number) {
        this.audio.volume = value * 0.01
    }

    goBack10s () {
        this.audio.currentTime -= 10
    }
    
    goForward10s () {
        this.audio.currentTime += 10
    }

    onEnd () {
        if (this.trackNum != this.songs.length - 1) {
            this.skipNext()
        } else {
            this.pause()
        }
    }

    play () {
        this.paused = false
    }

    pause () {
        this.paused = true
    }

    setSong () {
        if (this.songs) {
            let id : string

            this.song = this.songs[this.trackNum]

            if (typeof this.songs[this.trackNum].user == "string") {
                id = this.songs[this.trackNum].user
            
                this.userService.getUserById(this.songs[this.trackNum].user).subscribe((user : User) => this.user = user)
            }
            else {
                this.user = this.songs[this.trackNum].user
                id = this.user._id
            }
                
            this.uri = getServerFileUrl(this.songs[this.trackNum].fileUrl)
            this.coverUri = this.songs[this.trackNum].coverUrl ? getServerFileUrl(this.songs[this.trackNum].coverUrl) : "./assets/song-placeholder.png"

            if (!this.currentUserService.isAuthorized(id))
                this.songService.addPlayToSong(this.song._id).subscribe((song : Song) => {
                })
        }
    }

    skipNext () {
        if (this.trackNum != this.songs.length - 1) {
            this.trackNum++
            this.setSong()
        }
    }

    skipPrev () {
        if (this.trackNum != 0) {
            this.trackNum--
            this.setSong()
        }
    }
}
