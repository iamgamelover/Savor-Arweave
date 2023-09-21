import React from 'react';
import { BsCheckLg, BsExclamationOctagonFill, BsFillImageFill, BsFillXCircleFill } from 'react-icons/bs';
import { Server } from '../../server/server';
import { getBannerImage, getPortraitImage, isValidEmail } from '../util/util';
import './Modal.css'
import './EditProfileModal.css'
import MessageModal from './MessageModal';
import AlertModal from './AlertModal';
import Compressor from 'compressorjs';
import { ARWEAVE_GATEWAY } from '../util/consts';

interface EditProfileModalProps {
  open: boolean;
  onClose: Function;
}

interface EditProfileModalState {
  changeBanner: boolean;
  changePortrait: boolean;
  banner: string;
  portrait: string;
  name: string;
  email: string;
  bio: string;
  created_at: string;
  message: string;
  alert: string;
  openBannerList: boolean;
  openPortraitList: boolean;
}

class EditProfileModal extends React.Component<EditProfileModalProps, EditProfileModalState> {

  pickBanner = false;

  constructor(props:EditProfileModalProps) {
    super(props);

    this.state = {
      changeBanner: false,
      changePortrait: false,
      banner: '',
      portrait: '',
      name: '',
      email: '',
      bio: '',
      created_at: '',
      message: '',
      alert: '',
      openBannerList: false,
      openPortraitList: false
    };

    this.onOpenBannerList = this.onOpenBannerList.bind(this);
    this.onCloseBannerList = this.onCloseBannerList.bind(this);
    this.onOpenPortraitList = this.onOpenPortraitList.bind(this);
    this.onClosePortraitList = this.onClosePortraitList.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
    this.onChangeEmail = this.onChangeEmail.bind(this);
    this.onChangeBio = this.onChangeBio.bind(this);
    this.onSaveProfile = this.onSaveProfile.bind(this);
    this.onClose = this.onClose.bind(this);
    this.onSelectFileChange = this.onSelectFileChange.bind(this);
  }

  componentDidMount(): void {
    this.resetState();
  }

  resetState() {
    this.setState({
      changeBanner: false,
      changePortrait: false,
      banner: Server.user.getBanner(),
      portrait: Server.user.getPortrait(),
      name: Server.user.getName(),
      email: Server.user.getEmail(),
      bio: Server.user.getBio(),
      created_at: Server.user.getCreatedAt(),
      message: '',
      alert: '',
      openBannerList: false,
      openPortraitList: false
    });
  }

  onOpenBannerList() {
    this.setState({openBannerList: true});
  }

  onCloseBannerList(banner:string) {
    let b = banner ? banner : this.state.banner;
    this.setState({openBannerList: false, banner: b});
  }
  
  onOpenPortraitList() {
    this.setState({openPortraitList: true});
  }

  onClosePortraitList(portrait:string) {
    let p = portrait ? portrait : this.state.portrait;
    this.setState({openPortraitList: false, portrait: p});
  }
  
  onChangeName(e:any) {
    this.setState({name: e.currentTarget.value});
  }

  onChangeEmail(e:any) {
    this.setState({email: e.currentTarget.value});
  }

  onChangeBio(e:any) {
    this.setState({bio: e.currentTarget.value});
  }

  async onSaveProfile() {
    let dirty = false;
    if(this.state.name != Server.user.getName()) dirty = true;
    // if(this.state.email != Server.user.getEmail()) dirty = true;
    if(this.state.bio != Server.user.getBio()) dirty = true;
    if(this.state.banner != Server.user.getBanner()) dirty = true;
    if(this.state.portrait != Server.user.getPortrait()) dirty = true;

    if(!dirty) {
      this.props.onClose();
      return;
    }

    let errorMsg = '';

    if(this.state.name.length < 3) 
      errorMsg = 'Name must be at least 3 characters.';

    if(this.state.name.length > 32) 
      errorMsg = 'Name must be at most 32 characters.';
  
    // if(!isValidEmail(this.state.email)) 
    //   errorMsg = 'Email invalid.';

    if(errorMsg != '') {
      this.setState({alert: errorMsg});        
      return;
    }

    this.setState({message: 'Saving profile...'});

    setTimeout(async () => {
      let params = {
        id: window.location.pathname.substring(9),
        name: this.state.name,
        email: this.state.email,
        banner: this.state.banner,
        portrait: this.state.portrait,
        bio: this.state.bio,
        created_at: this.state.created_at,
      };

      let response = await Server.user.updateProfile(params);
      
      if(response.success) {
        this.setState({message: ''});
        this.props.onClose();
      }
      else {
        this.setState({message: '', alert: response.message});
      }
    }, 500);
  }

  onClose() {
    this.resetState();
    this.props.onClose();
  }

  selectImage(pickBanner: boolean) {
    this.pickBanner = pickBanner;

    const fileElem = document.getElementById("fileElem");
    if (fileElem) {
      fileElem.click();
    }
  }

  onSelectFileChange(e: React.FormEvent<HTMLInputElement>): void {
    this.processImage(e.currentTarget.files[0]);
  };

  processImage(file: any) {
    if (!file) return;
    // let img = URL.createObjectURL(file);
    // console.log('FILE:', img);
    // this.setState({ portrait: img });

    // Compress the file
    new Compressor(file, {
      maxWidth: 1000,
      maxHeight: 1000,
      convertSize: 500000,
      success: (result) => {
        // Encode the file using the FileReader API to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          // console.log('Compress CoverImage', reader.result);
          let image = reader.result.toString();
          if (this.pickBanner)
            this.setState({ banner: image });
          else
            this.setState({ portrait: image });
        };

        reader.readAsDataURL(result);
      },
    });
  }

  render() {
    if(!this.props.open)
      return (<div></div>);

    let bannerImage = getBannerImage({banner: this.state.banner});
    let portraitImage = getPortraitImage({portrait: this.state.portrait});

    return (
      <div className="modal open">
        <div className="modal-content edit-profile-modal-content">
          <button className="modal-close-button" onClick={this.onClose}>
            <BsFillXCircleFill />
          </button>

          <div className="edit-profile-modal-header">Edit Profile</div>
          <div>
            <div className="edit-profile-banner-container">
              <img className="edit-profile-banner" src={bannerImage} onClick={()=>this.selectImage(true)} />
              <img className="edit-profile-portrait" src={portraitImage} onClick={()=>this.selectImage(false)} />

              <input
                type="file"
                id="fileElem"
                accept="image/*"
                className="file-select"
                onChange={this.onSelectFileChange}
              />
            </div>

            <div className='edit-profile-input-container'>
              <div className='edit-profile-input-row'>
                <div className='edit-profile-label'>Name</div>
                <input
                  className="edit-profile-input"
                  placeholder="Name"
                  value={this.state.name}
                  onChange={this.onChangeName}
                />
              </div>

              {/* <div className='edit-profile-input-row'>
                <div className='edit-profile-label'>Handle</div>
                <input
                  className="edit-profile-input"
                  placeholder="Name"
                  value={this.state.slug}
                  onChange={this.onChangeSlug}
                />
              </div> */}

              <div className='edit-profile-input-row'>
                <div className='edit-profile-label'>Bio</div>
                <textarea
                  className="edit-profile-textarea"
                  placeholder="Bio"
                  value={this.state.bio}
                  onChange={this.onChangeBio}
                />
              </div>

              <div>
                <button onClick={this.onSaveProfile}>Save</button>
              </div>
            </div>

          </div>
        </div>

        <MessageModal message={this.state.message} />
        <AlertModal message={this.state.alert} button="OK" onClose={()=>this.setState({alert: ''})}/>
      </div>
    )
  }
}

export default EditProfileModal;