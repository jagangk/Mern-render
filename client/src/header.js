import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from './userContext';

export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    const url = `${process.env.REACT_APP_API_URL}/profile`;
    fetch(url, {
      credentials: 'include',
    }).then(response => {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
      });
    });
  }, []);

  async function logout() {
    const url_2 = `${process.env.REACT_APP_API_URL}/logout`;
    const response = await fetch(url_2, {
      credentials: 'include',
      method: 'POST',
    });

    setUserInfo(null);

    if (response.ok) {
      alert('Log out successful');
      navigate('/');
    }
  }

  const username = userInfo?.username;

  return (
    <header>

      <div class="logo">
        <Link to="/" >
        <img class="icon" src="b.png" alt="Blogstera icon" /></Link>
        <Link class='web-title' to="/" >Blogstera</Link>
      </div>
      <nav>
        {username && (
          <>
            <div className="dropdown">
              <span>
                Welcome<Link className="dropbtn"> {username}</Link>
              </span>
              <div className="dropdown-content">
                <Link to="/create">Create post</Link>
                <Link to="/">Feeds</Link>
                <Link to="/contact">Contact</Link>
                <Link onClick={logout}>Logout</Link>
              </div>
            </div>
          </>
        )}
        {!username && (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to='/contact'>Contact</Link>
          </>
        )}
      </nav>

    </header>
  );
}
