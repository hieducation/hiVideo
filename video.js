import React, { Component } from 'react';
import { 
    View, 
    TouchableOpacity, 
    TouchableWithoutFeedback,
    Image, 
    Text, 
    Dimensions, 
    Platform, 
    Modal,
    Animated,
    PanResponder
} from 'react-native';
import Video from 'react-native-video';
import EventEmitter from "react-native-eventemitter";
import { Icon } from 'react-native-elements';

import { setStyle } from './style';

const deviceWidth = Dimensions.get('window').width;
const deviceHeight = Dimensions.get('window').height;

class HiVideo extends Component{

    /// funções para GOOGLECAST
    registerListeners = (element) => {
        const events = `
          SESSION_STARTING SESSION_STARTED SESSION_START_FAILED SESSION_SUSPENDED
          SESSION_RESUMING SESSION_RESUMED SESSION_ENDING SESSION_ENDED
          MEDIA_STATUS_UPDATED MEDIA_PLAYBACK_STARTED MEDIA_PLAYBACK_ENDED
        `.trim().split(/\s+/)
        events.forEach(event => {
          element.state.GoogleCast.EventEmitter.addListener(element.state.GoogleCast[event], function() {
            switch(event){
                case 'SESSION_STARTED':
                    element.setState({casting: true});
                break;
                case 'MEDIA_STATUS_UPDATED':
                    if(!element.casting) element.setState({casting: true})
                    // this.vid._fullScreenOff();
                break;
                case 'SESSION_ENDED':
                    element.setState({casting: false})
                break;
            }
          })
        })
    }

    _setGoogleCast(){
        this._setVideoObject();
        GoogleCast.castMedia(this.state.video);
    }

    /// funções para GoogleCast

    _setVideoObject(){
        let { video, name, theme } = unit;
        var hms = this.props.duration;
        var a = hms.split(':');
        var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (parseInt(+a[2]) ); 

        let videoJSON = {
            title: this.props.title,
            studio: this.props.studio || 'HiVideo by @jaime.neto85',
            mediaUrl: this.props.source && this.props.source.uri? this.props.source.uri : this.props.source,
            imageUrl: this.props.cover || this.props.poster,
            posterUrl: this.props.poster,
            streamDuration: seconds,
            playPositon: this.state.seekerPosition
        }
        this.setState({ video: videoJSON });
    }

   constructor(props){
       super(props);
       const position = new Animated.ValueXY();
       const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: ( evt, gestureState ) => true,
            onMoveShouldSetPanResponder: ( evt, gestureState ) => true,
            onPanResponderGrant: ( evt, gestureState ) => {
            this.setState( {seeking: true}, () => this._showPlayer() );
           },
           onPanResponderMove: (event, gesture) => {
            const position = this.state.seekerOffset + gesture.dx;
            this.setSeekerPosition( position );
           },
           onPanResponderRelease: (event, gesture) => {
               const time = this._calculateTimeFromSeekerPosition();
               let state = this.state;
               if ( time >= state.duration && ! state.showPoster ) {
                    state.shouldPlay = false;
                    if(this.vid) this.vid.onEnd();
                } else {
                    this.seekTo( time );
                    state.seeking = false;
                }
                this.setState( state );
           }
       });
       EventEmitter.on('newPlay', this._soundOff);
       this.state = {
           showPoster: true,
           volume: props.volume,
           duration: 100,
           currentTime: 0,
           playableDuration: 0,
           shouldPlay: props.shouldPlay,
           fullscreen: false,
           showModal: false,
           playerAnimation:  new Animated.Value(1),
           panResponder,
           GoogleCast: props.GoogleCast,
           casting: false,
           position,
           seekerWidth: 0,
           seekerPosition: 0,
           seekerOffset: 0,
           seeking:false,
           firstPlay: false
       }
   }

   async componentDidMount(){
       if(this.state.GoogleCast){
        this.registerListeners(this);
        let castState = await this.state.GoogleCast.getCastState();
        if( castState && castState == 'Connected' && !this.state.casting ) this.setState({casting: true})
        if ( this.props.volume != this.state.volume ) this.setState({ volume: this.props.volume })
       }
   }

    _onLoadStart = payload =>{
        // console.log('onLoadStart ', payload);
        // console.log('this.vid: ', this.vid)
    }

    _onLoad = (event) => {
        this.setState({showPoster: false, duration: event.duration, currentTime: event.currentTime })
    }
    _onBuffer = (callback) => {
        // console.log('callback onBuffer: ', callback)
    }

    _onError = (callback) => {
        // console.log('callback onError: ', callback)
    }

    _renderPlayer = () => {
        if( !this.state.showPoster ){
            switch(this.props.playerType){
                case 'mute':
                return this.mutePlayer();
                case 'full':
                return this.fullPlayer();
            }
        }
    }

    _showPlayer(){
        Animated.timing(
            this.state.playerAnimation,
            { toValue: 1, duration: 200 })
            .start(() => {
                if(this.state.shouldPlay && !this.state.seeking) {
                    Animated.sequence([
                      Animated.delay(1500),
                      Animated.timing( this.state.playerAnimation,
                          { toValue: 0, duration: 200 } )
                  ])
                  .start(); }                
            }
          )
    }

    _firstPlay(){
        if(this.props.firstPlay) {
            this.props.firstPlay();
        }
    }

    _onProgress = (event) =>{
        // console.log('onProgress: ', event);
        let state = this.state;
        state.currentTime = event.currentTime;

        if ( ! state.seeking ) {
            const position = this._calculateSeekerPosition();
            this.setSeekerPosition( position );

            if( !this.state.firstPlay ) {
                this._firstPlay();
            }
        }

        this.setState({ currentTime: event.currentTime, playableDuration: event.playableDuration})
        if( ! this.state.firstPlay ) this.setState({ firstPlay: true })
    }


    // component of TIME
    _renderSecondsInTime(secondsRaw){
        let minutes = parseInt(secondsRaw/60);
        let seconds = Math.round(secondsRaw%60);
        let minutesRender = minutes < 10 ? `0${minutes}` : minutes;
        let secondsRender = seconds < 10 ? `0${seconds}` : seconds;
        return `${minutesRender}:${secondsRender}`;
    }

    _calculateTimeFromSeekerPosition(){
        const percent = this.state.seekerPosition / this.state.seekerWidth;
        return this.state.duration * percent;
    }

    _calculateSeekerPosition() {
        const percent = this.state.currentTime / this.state.duration;
        return this.state.seekerWidth * percent;
    }

    setSeekerPosition( position = 0 ) {
        let state = this.state;
        position = this.constrainToSeekerMinMax( position );

        state.seekerFillWidth = position;
        state.seekerPosition = position;

        if ( ! state.seeking ) {
            state.seekerOffset = position
        };

        this.setState( state );
    }

    constrainToSeekerMinMax( val = 0 ) {
        if ( val <= 0 ) {
            return 0;
        }
        else if ( val >= this.state.seekerWidth ) {
            return this.state.seekerWidth;
        }
        return val;
    }


    seekTo( time = 0 ) {
        let state = this.state;
        state.currentTime = time;
        this.vid.seek( time );
        this.setState( state );
    }
    // component TIME
    _togglePlay = (stop) => {
        let { shouldPlay } = this.state;
        this.setState({ shouldPlay: !this.state.shouldPlay });
        this._showPlayer()
    }

    renderPoster(){
        let { showPoster } = this.state;
        if(showPoster){
            return(
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <Image 
                        source={require('../../assets/images/loading_buffer.gif')} 
                        style={[{ position: 'absolute', zIndex: 1, opacity: 0.5, height: 70, width: 70 }] } 
                        resizeMode='contain'
                    />
                    <Image 
                        source={this.props.poster} 
                        style={setStyle(showPoster ? {} : {width:0, height:0 }, this.props.style )}
                    />
                </View>
            )
        }
    }
    renderVideo = () => {
        let { showPoster } = this.state;
        return(
        <Video 
            ref={r => this.vid = r}
            source={this.props.source}
            volume={this.state.volume}
            repeat={this.props.repeat}
            resizeMode={this.props.resizeMode}
            style={ setStyle(showPoster ? {width: 0, height: 0 } : ( this.state.fullscreen? { width: '100%', height: '100%' } : { backgroundColor: 'transparent' }), this.props.style )}
            // fullscreenOrientation='landscape'
            onLoadStart={this._onLoadStart}
            onLoad={this._onLoad}
            onBuffer={this._onBuffer}
            onError={this._onError}
            onProgress={this._onProgress}
            paused={!this.state.shouldPlay}
            fullscreen={this.state.fullscreen}
            ignoreSilentSwitch={'ignore'}
            // playWhenInactive
            // playInBackground
            onPictureInPictureStatusChanged={this._picInPic}
            onFullscreenPlayerWillPresent={ () => { this._onFullScreen() } }
            onFullscreenPlayerDidPresent={ (event) => this.setState({fullscreen: true})}
            onFullscreenPlayerWillDismiss={ () => { this._outFullScreen()  }}
            onFullscreenPlayerDidDismiss={ () => { this.setState({fullscreen: false}); this.props.outFullScreen()} }
        />)
    }

    _onFullScreen = () =>{
        this.setState({showModal: true, fullscreen: true})
        if(this.props.onFullScreen) return this.props.onFullScreen();
    }

    _outFullScreen = () =>{
        this.setState({showModal: false, fullscreen: false})
        if(this.props.outFullScreen) return this.props.outFullScreen();
    }

    renderModal(video, player){
            return(
                <Modal 
                    visible={this.state.showModal}
                    animationType='fade'
                    transparent={false}
                >
                <View style={{ width: '100%', height: '100%', left: 0, right: 0, backgroundColor: '#000'}}>
                    {video}
                    {player}
                </View>
                </Modal>
            )
    }

    
    render(){
        let video = this.renderVideo();
        let player = this._renderPlayer();
        return(
                <TouchableWithoutFeedback onPress={ () => this._showPlayer() }>
                    <View style={ this.state.fullscreen? { width: '100%', height: Dimensions.get('window').height } : { backgroundColor: 'transparent' } }>
                            {this.renderPoster()}
                            {video}
                            { this.props.hidePlayer ? null : player}
                            {/* {this.renderModal( video, player )} */}
                    </View>
                </TouchableWithoutFeedback>
        )
    }

    //controls
    toggleSound = () => {
        if(this.state.volume != 0){
            this.setState({ volume: 0 })
        } else {
            this.setState({ volume: 1 })
        }
    }

    _soundOff = () => {
        this.setState({ volume: 0 })
    }

    _toggleFullScreen = () => {
        if(this.state.fullscreen){
            // this.vid.dismissFullscreenPlayer()
            this.setState({fullscreen: false, showModal: false})
            this.props.outFullScreen();
        }else{
            // this.vid.presentFullscreenPlayer()
            this.setState({fullscreen: true})
            this.setState({ showModal: true })
            this.props.onFullScreen();
        }
    }

    _fullScreenOff = () => {
        if(this.state.fullscreen){
            // this.vid.dismissFullscreenPlayer()
            this.setState({fullscreen: false, showModal: false})
            this.props.outFullScreen();
        }
    }

    _fullScreenOn = () =>{
        if(!this.state.fullscreen){
            // this.vid.presentFullscreenPlayer()
            this.setState({fullscreen: true})
            this.setState({ showModal: true })
            this.props.onFullScreen();
        }
    }

    iconPlay = () => {
        if(this.props.iconPlay && this.props.iconPause){
            return this.iconPlayCustom();
        } else {
            return this.iconPlayDefault();
        }
    }

    iconPlayDefault(){
        return( <Text style={{color: 'white'}}>{ this.state.shouldPlay ? 'Pause' : 'Play' }</Text> )
    }

    iconPlayCustom(){
        if(this.state.shouldPlay){
            return this.props.iconPause;
         } else {
            return this.props.iconPlay;
         } 
    }

    // players
    mutePlayer = () => (
        <Animated.View style={{opacity: this.state.playerAnimation}}>
            <TouchableOpacity onPress={this.toggleSound} style={{ width: 50, height: 40, borderRadius: 5, position: 'absolute', right: 15, bottom: 15, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}}>
                <View>
                    <Icon name={this.state.volume == 0 ? 'volume-off' : 'volume-up'} color='white' type='ionicons'/>
                </View>
            </TouchableOpacity>
        </Animated.View>
    )

    _renderNextButton(){
        if(this.props.next){

            return (
                <TouchableOpacity onPress={this.props.next}>
                    {this.props.iconNext}
                </TouchableOpacity>
            )
        } 
    }

    _renderPrevButton(){
        if(this.props.prev){

            return (
                <TouchableOpacity onPress={this.props.prev}>
                    {this.props.iconPrev}
                </TouchableOpacity>
            )
        }
    }

    //fullplayer
    fullPlayer = () => {
        if(!this.state.casting){
            return(
                <Animated.View style={{ width: '100%', height: '100%', position: 'absolute', backgroundColor: 'rgba(0,0,0,0.5)', opacity: this.state.playerAnimation, zIndex: 99}}>
                    <View style={{position: 'absolute', left: '5%', bottom: 20}}>
                        <Text style={{color: 'white'}}>{this._renderSecondsInTime(this.state.currentTime)}</Text>
                    </View>
                    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                        <View style={{position: 'absolute', left: 15}}>
                            {this._renderPrevButton()}
                        </View>
                        <TouchableOpacity onPress={this._togglePlay}>
                            {this.iconPlay()}
                        </TouchableOpacity>
                        <View style={{position: 'absolute', right: 15}}>
                            {this._renderNextButton()}
                        </View>
                    </View>

                    <View style={{position: 'absolute', right: '5%', bottom: 20, flexDirection: 'row'}}>
                        <Text style={{color: 'white'}}>{this._renderSecondsInTime(this.state.duration)}</Text>
                        <TouchableOpacity onPress={ () => { this._toggleFullScreen() } } style={{marginLeft: 5}}>
                            { this.props.iconFullScreen ? (this.props.iconFullScreen) : (<Text style={{color: 'white'}}>Fullscreen</Text>) }
                        </TouchableOpacity>
                    </View>
                    
                    {/* timer do player */}
                    <View 
                        style={{ backgroundColor: '#979797', width: '90%', height: 5, flex: 1, position: 'absolute', bottom: 10, left: '5%', zIndex: 99}}
                        onLayout={ event => this.state.seekerWidth = event.nativeEvent.layout.width }
                    >
                        <View style={{ backgroundColor: '#D8D8D8', width: `${(this.state.playableDuration/this.state.duration)*100}%`, height: '100%', position: 'absolute', left: 0, bottom: 0 }} />
                        <View style={{ backgroundColor: '#A01D4C', width: `${(this.state.currentTime/this.state.duration)*100}%`, height: '100%', position: 'absolute', left: 0, bottom: 0 }} />
                        
                        <View 
                            style={[ {left: this.state.seekerPosition }, {zIndex: 99} ]}
                            {...this.state.panResponder.panHandlers}
                        >
                            <View 
                                style={{
                                    backgroundColor: '#A01D4C', 
                                    height: 20, 
                                    width: 20, 
                                    borderRadius: 20, 
                                    position: 'absolute',
                                    marginLeft: -5, 
                                    marginTop: -8
                                    }}
                                
                            />
                        </View>
                    </View>
                </Animated.View>
            )    
        }
    }
}

export default HiVideo;
