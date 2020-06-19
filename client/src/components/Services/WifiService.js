import { json } from "d3";

class WifiService {
    constructor() {
        const instance = this.constructor.instance;
        if (instance) {
            return instance;
        }

        this.constructor.instance = this;

        this.responses = {};
        this.baseUrl = 'http://localhost:8080';
        // this.baseUrl = 'http://localhost:8080';

        this.controller = new AbortController();
    }

    _get(request, callback) {
        let signal = this.controller.signal;

        if (!this.responses[request]) {
            this.responses[request] = new Promise((res, rej) => {
                json(`${this.baseUrl}/${request}`, { signal })
                    .then(response => res(callback(response)))
                    .catch(err => {
                        delete this.responses[request];
                        rej(err);
                    });
            });
        }

        return this.responses[request]; // promise
    }

    getChannelValues(c, th, r) {
        let request = `mongo/values/channel/${c}/threshold/${th}/ratio/${r}`;

        return this._get(request, response => response);
    }

    getChannelsValues(th, r) {
        let request = `mongo/values/channels/threshold/${th}/ratio/${r}`;

        return this._get(request, response => response);
    }

    getChannelOccupacy(c, th, r) {
        let request = `mongo/occupacy/channel/${c}/threshold/${th}/ratio/${r}`;

        return this._get(request, response => response);
    }

    getChannelsOccupacy(th) {
        let request = `mongo/occupacy/channels/threshold/${th}`;

        return this._get(request, response => response);
    }

    getBandOccupacy(b, th) {
        let request = `mongo/occupacy/band/${b}/threshold/${th}`;

        return this._get(request, response => response);
    }

    abort() {
        this.controller.abort();
    }
}

export default new WifiService();