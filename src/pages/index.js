import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useCookies } from 'react-cookie';
import UrlInformation from '../components/UrlInformation';
import changeHex from '../helpers/changeHex';

function NewUrlForm({ onSubmit, originalUrl, hash, inputHandler, loader }) {
  return (
    <>
      <form onSubmit={onSubmit}>
        <label
          className="block my-2 text-lg font-medium text-gray-900 dark:text-gray-600"
          htmlFor="original-url"
        >
          URL *
        </label>
        <input
          value={originalUrl}
          onChange={(event) => inputHandler(event, 'url')}
          className="block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
            "
          id="original-url"
          type="url"
          placeholder="https://example.com"
          required
        />

        <label
          className="block my-2 text-lg font-medium text-gray-900 dark:text-gray-600"
          htmlFor="hash"
        >
          Hash
        </label>
        <input
          value={hash}
          onChange={(event) => inputHandler(event, 'hash')}
          className="block w-full px-3 py-1.5 text-base font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none
            "
          id="hash"
          type="text"
          placeholder="example"
        />

        {loader ? (
          <button
            type="submit"
            disabled
            className="trasition duration-200 text-white bg-gray-500 hover:bg-gray-600 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mt-6 mb-2 w-full"
          >
            <p className="animate-spin">X</p>
          </button>
        ) : (
          <button
            type="submit"
            className="trasition duration-200 text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mt-6 mb-2 w-full"
          >
            Create
          </button>
        )}
      </form>
    </>
  );
}

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [hash, setHash] = useState('');
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [cookies, setCookie] = useCookies(['unsplash']);
  const [loader, setLoader] = useState(false);
  const [backgroundData, setBackgroundData] = useState(null);
  const [backgroundColor, setBackgroundColor] = useState('#334155');

  useEffect(() => {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    changeHex(setBackgroundColor);

    async function getRandomPhoto() {
      if (cookies.unsplash) {
        setBackgroundData(cookies.unsplash);
      } else {
        const request = await fetch('/api/unplash');
        const response = await request.json();

        console.log(response);
        if (response.status === 401) {
          setError('UNPLASH' + response.errors[0].toString());
          setTimeout(() => {
            setError(null);
          }, 3000);
          return;
        } else if (response.status === 500) {
          setError('UNPLASH ' + response.message.message.toString());
          setTimeout(() => {
            setError(null);
          }, 3000);
          return;
        }

        setBackgroundData({
          url: response.response.urls.regular,
          author: {
            name: response.response.user.name,
            username: response.response.user.username,
          },
        });
        setCookie(
          'unsplash',
          {
            url: response.response.urls.regular,
            author: {
              name: response.response.user.name,
              username: response.response.user.username,
            },
          },
          {
            expires: tomorrow,
          },
        );
      }
    }
    getRandomPhoto();
  }, [cookies, setCookie, backgroundData]);

  function inputHandler(event, type) {
    if (type === 'url') {
      setOriginalUrl(event.target.value);
      setData({
        url: event.target.value,
        hash: hash,
      });
    } else if (type === 'hash') {
      setHash(event.target.value);
      setData({
        url: originalUrl,
        hash: event.target.value,
      });
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    setLoader(true);

    if (data.url.length < 1) return;
    if (/ /gs.test(data.hash) || / /gs.test(data.url)) {
      setError('Remove spaces');
      setLoader(false);
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }

    try {
      const request = await fetch(`/api/new`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(data),
      });
      const response = await request.json();
      if (response?.status === 'error') {
        throw response.message;
      }

      setLoader(false);
      setStatus(response);
    } catch (error) {
      setError(error.toString());
      setLoader(false);
      setTimeout(() => {
        setError(null);
      }, 3000);
      return;
    }

    setOriginalUrl('');
    setHash('');
  }

  return (
    <>
      <Head>
        <title>Url Shotenner</title>
      </Head>
      <div
        className="bg-cover h-screen flex justify-center flex-col"
        style={
          backgroundData
            ? {
                backgroundImage: 'url(' + backgroundData?.url + ')',
              }
            : { background: backgroundColor }
        }
      >
        <div className="w-1/1 sm:w-1/2 lg:w-1/3 m-auto p-6 bg-slate-50 rounded-md">
          {status ? (
            <UrlInformation setStatus={setStatus} data={status} />
          ) : (
            <NewUrlForm
              onSubmit={onSubmit}
              originalUrl={originalUrl}
              hash={hash}
              inputHandler={inputHandler}
              loader={loader}
            />
          )}
          {error ? (
            <div
              className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          ) : null}
        </div>
        <div>
          {backgroundData ? (
            <span className="text-white">
              Photo by{' '}
              <a
                href={`https://unsplash.com/@${backgroundData.author.username}?utm_source=URL_shortener&utm_medium=referral`}
                target="_blank"
                rel="noreferrer"
              >
                {backgroundData?.author?.name}
              </a>{' '}
              on{' '}
              <a
                href="https://unsplash.com/?utm_source=URL_shortener&utm_medium=referral"
                rel="noreferrer"
                target="_blank"
              >
                Unsplash
              </a>
            </span>
          ) : null}
        </div>
      </div>
    </>
  );
}
