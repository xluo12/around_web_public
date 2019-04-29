import React from 'react';
import { Tabs, Spin } from 'antd';
import { GEO_OPTIONS, POS_KEY, AUTH_PREFIX, TOKEN_KEY, API_ROOT} from '../constants';
import { Gallery } from './Gallery';
import { CreatePostButton } from './CreatePostButton'
import { WrappedAroundMap } from './AroundMap'

const TabPane = Tabs.TabPane;

export class Home extends React.Component {
    state = {
        loadingGeoLocation: false,
        loadingPosts: false,
        error: '',
        posts: [],
    }

    componentDidMount() {
        this.setState( {loadingGeoLocation: true, error: '' });
        this.getGeoLocation();
    }

    getGeoLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                this.onSuccessLoadGeolocation,
                this.onFailedLoadGeoLocation,
                GEO_OPTIONS,
            );
        } else {
            this.setState( {loadingGeoLocation: false, error: 'geolocation is not available' });
        }
    }

    onSuccessLoadGeolocation = (position) => {
        console.log(position);
        this.setState( {loadingGeoLocation: false });
        const {latitude, longitude } = position.coords;
        localStorage.setItem(POS_KEY, JSON.stringify({ lat: latitude, lon: longitude }));
        this.loadNearByPosts();
    }

    onFailedLoadGeoLocation = () => {
        this.setState( {loadingGeoLocation: false, error: 'Failed to load geo location' });
    }

    loadNearByPosts = (location, range) => {
        this.setState({ loadingPosts: true, error: '' });
        const { lat, lon } = location ? location : JSON.parse(localStorage.getItem(POS_KEY));
        const radius = range ? range : 10000;

        const url = `${API_ROOT}/search?lat=${lat}&lon=${lon}&range=${radius}`;
        const token = `${AUTH_PREFIX} ${localStorage.getItem(TOKEN_KEY)}`;
        console.log('url: ', url);
        console.log('token: ', token);       
        fetch(url, {
            method: 'get',
            headers: {
                'Authorization': token
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('data: ', data);
            this.setState(
                { 
                    posts: data || [],
                    loadingPosts: false, 
                    error: '' 
                }
            );
        })
        .catch(error => {
            console.log(error);
            this.setState({ loadingPosts: false, error: 'Failed to load posts!' });
        });
    }

    getGalleryPanelContent = () => {
        if (this.state.error) {
            return <div>{this.state.error}</div>;
        } else if (this.state.loadingGeoLocation) {
            return <Spin tip="loading geo location..."/>;
        } else if (this.state.loadingPosts) {
            return <Spin tip="Loading posts..." />;
        } else if (this.state.posts && this.state.posts.length > 0) {
            const images = this.state.posts.map((post) => {
                return {
                    user: post.user,
                    src: post.url,
                    thumbnail: post.url,
                    caption: post.message,
                    thumbnailWidth: 400,
                    thumbnailHeight: 300,
                };
            });
            return <Gallery images={images}/>;
        }
        return null;
    }

    render() {
        const createPostButton = <CreatePostButton loadNearbyPosts={this.loadNearbyPosts}/>;
        return (
        <Tabs tabBarExtraContent={createPostButton} className="main-tabs">
            <TabPane tab="Posts" key="1">
                {this.getGalleryPanelContent()}
            </TabPane>
            <TabPane tab="Map" key="2"> 
                <WrappedAroundMap 
                    googleMapURL="https://maps.googleapis.com/maps/api/js?key=[YOUR_API_KEY]&v=3.exp&libraries=geometry,drawing,places" 
                    loadingElement={<div style={{ height: `100%` }} />} 
                    containerElement={<div style={{ height: `600px` }} />} 
                    mapElement={<div style={{ height: `100%` }} />} 
                    posts = { this.state.posts}
                    loadNearByPosts={this.loadNearByPosts}
                /> 
            </TabPane>
        </Tabs>
        );
    }
}
