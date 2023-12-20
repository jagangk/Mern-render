import {format} from 'date-fns'
import { Link} from 'react-router-dom';
export default function Post({_id,author,createdAt,title,summary,cover,content}){
  const url = `${process.env.REACT_APP_API_URL}/`;

    return (
        <div class="post">
         <div class="image">
          <Link to={`/post/${_id}`}>
           <img src={url + cover} alt=''/>
          </Link>
        </div>

        <div class="text">
        <Link to={`/post/${_id}`}>
           <h2>{title}</h2>
        </Link>
          <p class="info">
            <a class="author">{author.username}</a>
            <time>{format(new Date(createdAt), 'dd/LL/yyyy')}</time>
          </p>
          <p class="summary">{summary}</p>
        </div>
      </div>
    );
}